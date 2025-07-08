import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  if (error) {
    return NextResponse.json({ 
      error: 'Authorization failed', 
      details: error 
    }, { status: 400 });
  }
  
  if (!code) {
    return NextResponse.json({ 
      error: 'No authorization code received' 
    }, { status: 400 });
  }

  // Return HTML page with the code and instructions
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TikTok Authorization Code</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .code { background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; }
        .button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .success { color: green; margin-top: 20px; }
        .error { color: red; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>TikTok Authorization Successful!</h1>
      <p>Your authorization code is:</p>
      <div class="code">${code}</div>
      
      <h3>Next Steps:</h3>
      <p>Click the button below to automatically exchange this code for your access token:</p>
      <button class="button" onclick="exchangeCode()">Get Access Token</button>
      
      <div id="result"></div>
      
      <script>
        async function exchangeCode() {
          const resultDiv = document.getElementById('result');
          resultDiv.innerHTML = '<p>Exchanging code for token...</p>';
          
          try {
            const response = await fetch('/api/auth/tiktok/simple-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code: '${code}' })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              resultDiv.innerHTML = '<div class="success"><h3>Success!</h3><p>Your TikTok account has been connected. You can now close this window and return to the app.</p></div>';
              // Redirect to main app after 2 seconds
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
            } else {
              resultDiv.innerHTML = '<div class="error"><h3>Error:</h3><p>' + data.error + '</p></div>';
            }
          } catch (error) {
            resultDiv.innerHTML = '<div class="error"><h3>Error:</h3><p>' + error.message + '</p></div>';
          }
        }
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
} 