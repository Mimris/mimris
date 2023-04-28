async function generateText(prompt) {
    const apiKey = process.env.OPENAI_API_KEY;
    // const apiKey = 'YOUR_API_KEY';
    const apiUrl = 'https://api.openai.com/v1/engines/davinci-codex/completions';
  
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 100,
        n: 1,
        stop: '\n'
      })
    });
  
    const data = await response.json();
    const text = data.choices[0].text.trim();
  
    return text;
  }



const prompt = 'Write a short story about a robot who learns to love.';
const text = await generateText(prompt);
console.log(text);