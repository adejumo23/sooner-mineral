# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`



## Run using Docker

1. Install docker desktop
2. Open up cmd (in Windows) or iterm (in Mac)
3. navigate to the code folder using cd
4. run `docker compose up --build`
5. Open a browser and navigate to localhost:3000