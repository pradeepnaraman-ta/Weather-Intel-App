import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily to prevent startup crashes if API key is not set
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// 1. Geocoding and Forecast API Proxy
app.get("/api/weather", async (req, res) => {
  const city = req.query.city as string;
  const latParam = req.query.lat as string;
  const lonParam = req.query.lon as string;

  if (!city && (!latParam || !lonParam)) {
    return res.status(400).json({ error: "City or lat/lon parameters are required" });
  }

  try {
    let latitude: number;
    let longitude: number;
    let name: string;
    let country: string;
    let admin1: string;
    let timezone: string = "auto";

    if (latParam && lonParam) {
      latitude = parseFloat(latParam);
      longitude = parseFloat(lonParam);
      name = "My Location";
      country = "GPS Coords";
      admin1 = "";
    } else {
      // Phase A: Resolve City to Coordinates using Open-Meteo Geocoding API
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
      const geocodeRes = await fetch(geocodeUrl);
      if (!geocodeRes.ok) {
        throw new Error(`Geocoding API responded with status ${geocodeRes.status}`);
      }

      const geocodeData = await geocodeRes.json();
      if (!geocodeData.results || geocodeData.results.length === 0) {
        return res.status(404).json({ error: "City not found" });
      }

      // Grab the first result as the primary match
      const primaryMatch = geocodeData.results[0];
      latitude = primaryMatch.latitude;
      longitude = primaryMatch.longitude;
      name = primaryMatch.name;
      country = primaryMatch.country || "";
      admin1 = primaryMatch.admin1 || "";
      timezone = primaryMatch.timezone || "auto";
    }

    // Phase B: Get Weather details from Open-Meteo Forecast API
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_probability_max,wind_speed_10m_max&timezone=${encodeURIComponent(timezone)}`;
    
    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) {
      throw new Error(`Forecast API responded with status ${forecastRes.status}`);
    }

    const forecastData = await forecastRes.json();

    return res.json({
      location: {
        name,
        country,
        region: admin1,
        latitude,
        longitude,
        timezone: forecastData.timezone || timezone
      },
      current: forecastData.current,
      hourly: forecastData.hourly,
      daily: forecastData.daily,
    });
  } catch (error: any) {
    console.error("Error in /api/weather proxy:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch weather data" });
  }
});

// 2. Gemini Recommendation Engine Route
app.post("/api/recommendations", async (req, res) => {
  const { location, current, daily } = req.body;

  if (!location || !current) {
    return res.status(400).json({ error: "Missing required weather payload elements" });
  }

  // Define fallback, high-quality rule-based recommendations if Gemini key is missing
  const getRuleBasedRecommendations = () => {
    const temp = current.temperature_2m;
    const code = current.weather_code;
    const isRaining = current.rain > 0 || current.showers > 0 || current.precipitation > 0;
    const isSnowing = current.snowfall > 0;

    let summary = `Currently in ${location.name}, it is ${temp}°C with typical conditions for this climate.`;
    let clothing = ["Standard comfortable clothing appropriate for the temperature."];
    let activities = [
      { name: "City exploration", type: "outdoor", reason: "Perfect for getting to know the neighborhood." },
      { name: "Local museum visit", type: "indoor", reason: "Always a solid option regardless of the elements." }
    ];
    let warnings: string[] = [];
    let weeklyOutlook = "The 7-day trend shows fluctuating conditions. Keep an eye on local forecasts.";

    if (temp <= 5) {
      summary = `It's a very cold day in ${location.name} at ${temp}°C. Bundling up is highly recommended.`;
      clothing = ["Heavy winter coat", "Thermal layers", "Beanie and gloves", "Warm insulated boots"];
      activities = [
        { name: "Cozy coffee shop reading", type: "indoor", reason: "Escape the bitter cold with a warm beverage." },
        { name: "Scenic winter walk", type: "outdoor", reason: "Beautiful crisp views if you are dressed appropriately." }
      ];
      if (isSnowing) {
        warnings.push("Potential icy walkways or snowy road conditions. Take extra caution traveling.");
      }
    } else if (temp > 5 && temp <= 15) {
      summary = `The weather in ${location.name} is cool and brisk (${temp}°C). Great for light outdoor strolls.`;
      clothing = ["Windbreaker or light jacket", "Jeans", "Comfortable walking shoes", "Scarf for breezy areas"];
      activities = [
        { name: "Park photography", type: "outdoor", reason: "Slightly cool and diffuse lighting is excellent for outdoor photography." },
        { name: "Art gallery tour", type: "indoor", reason: "Stay warm while admiring local creative showcases." }
      ];
    } else if (temp > 15 && temp <= 25) {
      summary = `A beautiful, comfortable day in ${location.name} at ${temp}°C. This is peak weather for being active!`;
      clothing = ["T-shirt or casual shirt", "Comfortable shorts or chinos", "Sneakers or breathable slip-ons", "Sunglasses"];
      activities = [
        { name: "Biking or running outdoors", type: "outdoor", reason: "Ideal moderate temperatures prevent overheating during intense workouts." },
        { name: "Picnic at the local park", type: "outdoor", reason: "Soak in the pleasant ambient temperature with some snacks." }
      ];
    } else {
      summary = `It's quite warm in ${location.name} at ${temp}°C. Stay hydrated and seek shade during midday hours.`;
      clothing = ["Lightweight breathable linen clothing", "Sunglasses", "Wide-brimmed sun hat", "Sandal or canvas shoes"];
      activities = [
        { name: "Swimming or water sports", type: "outdoor", reason: "Refresh yourself in the water to beat the heat." },
        { name: "Indoor cinema movie night", type: "indoor", reason: "Relax in air-conditioned comfort during peak heat." }
      ];
      if (daily?.uv_index_max?.[0] > 6) {
        warnings.push("High UV radiation index today. Apply SPF 30+ sunscreen and wear protective eyewear.");
      }
    }

    if (isRaining) {
      summary += " Umbrella and water-resistant layers are highly advised as precipitation is present.";
      clothing.push("Waterproof jacket or trench coat", "Umbrella or rain hat", "Water-resistant boots");
      activities = activities.map(act => act.type === "outdoor" ? { name: "Indoor board games or bowling", type: "indoor", reason: "Fun indoor gathering while it pours outside." } : act);
      warnings.push("Wet, slippery road conditions. Drive defensively and watch for puddles.");
    }

    return {
      summary,
      clothing,
      activities,
      warnings,
      weeklyOutlook
    };
  };

  const client = getGeminiClient();
  if (!client) {
    console.log("No Gemini API key found or invalid. Returning rule-based recommendations.");
    return res.json({
      recommendations: getRuleBasedRecommendations(),
      isDemo: true
    });
  }

  try {
    const prompt = `Analyze the current weather data and daily forecast for ${location.name}, ${location.country || ""}.
    
    Current Conditions:
    - Temperature: ${current.temperature_2m}°C
    - Apparent (Feels Like) Temp: ${current.apparent_temperature}°C
    - Humidity: ${current.relative_humidity_2m}%
    - Wind Speed: ${current.wind_speed_10m} km/h
    - Weather Code (WMO): ${current.weather_code} (Precipitation: ${current.precipitation} mm, Rain: ${current.rain} mm, Snow: ${current.snowfall} cm)
    
    Daily Max/Min Temps for the next 7 days:
    ${daily.time.map((t: string, i: number) => `- ${t}: Max ${daily.temperature_2m_max[i]}°C, Min ${daily.temperature_2m_min[i]}°C, Rain Prob: ${daily.precipitation_probability_max[i]}%`).join("\n")}
    
    Generate highly structured, engaging, and hyper-personalized recommendations appropriate for these metrics. Ensure the advice is highly practical for clothing choice, daily outdoor or indoor planning, health safety tips (e.g. UV, freeze, winds), and a 7-day outlook summary. Use the exact JSON schema provided.`;

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an intelligent meteorology assistant that translates precise weather measurements into gorgeous, conversational, and highly practical daily planning guidelines. Always be highly precise with your recommendations and follow the requested schema exactly.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A friendly, elegant 2-3 sentence overview of the current weather and how it affects the day's vibe."
            },
            clothing: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific clothing, footwear, and accessory recommendations (e.g., lightweight layers, umbrella, sunglasses)."
            },
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, description: "Must be exactly 'outdoor' or 'indoor'" },
                  reason: { type: Type.STRING, description: "Why this activity is perfect for the current weather conditions." }
                },
                required: ["name", "type", "reason"]
              },
              description: "3-4 recommended activities for today based on current conditions."
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Any health or safety cautions (e.g., UV protection needed, high wind speed alert, stay hydrated, slick roads). Keep empty if none."
            },
            weeklyOutlook: {
              type: Type.STRING,
              description: "A summary planning tip for the upcoming 7 days based on the multi-day forecast trends."
            }
          },
          required: ["summary", "clothing", "activities", "warnings", "weeklyOutlook"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response returned from Gemini API");
    }

    const recommendations = JSON.parse(text.trim());
    return res.json({
      recommendations,
      isDemo: false
    });

  } catch (error: any) {
    console.error("Gemini recommendation error:", error);
    // Graceful fallback to rule-based recommendations on error
    return res.json({
      recommendations: getRuleBasedRecommendations(),
      isDemo: true,
      error: "Gemini API experienced an error; showing meteorological fallback insights."
    });
  }
});

// 3. Vite development vs static production server middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
