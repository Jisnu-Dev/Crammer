import google.generativeai as genai

API_KEY = "AIzaSyALQRn9vLO8qYww9tbv7DrR69ADdBOAbwQ"

genai.configure(api_key=API_KEY)

try:
    model = genai.GenerativeModel("gemini-3-flash")
    response = model.generate_content("Say hello")

    print("✅ API Key works!")
    print("Response:", response.text)

except Exception as e:
    print("❌ API Key failed")
    print("Error:", e)

