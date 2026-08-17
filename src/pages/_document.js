// ./pages/_document.js
// _document is only rendered on the server side and not on the client side
// Event handlers like onClick can't be added to this file

import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <script dangerouslySetInnerHTML={{__html: `
            (function() {
              if (typeof window !== 'undefined') {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                  const message = String(args[0] || '');
                  if (message.includes('The kernel') ||
                      message.includes('already registered') ||
                      message.includes('already been set') ||
                      message.includes('Platform browser')) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
              }
            })();
          `}} />
          {/* <meta http-equiv="Permissions-Policy" content="interest-cohort=()" /> */}
          {/* <meta name="viewport" content="height=device-height, initial-scale=1" /> */}
          {/* <link
            rel="stylesheet"
            href="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
            integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh"
            crossOrigin="anonymous"
          /> */}
          {/* <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossorigin="anonymous"></link> */}
          {/* <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-giJF6kkoqNQ00vy+HMDP7azOuL0xtbfIcaT9wjKHr8RbDVddVHyTfAAsrekwKmP1" crossOrigin="anonymous" /> */}
          <style>{`body { margin: 0 } /* custom! */`}</style>
          {/* <style>{ `.dialog {display: none}}    `}</style> */}
          {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link> */}
        </Head>

        <body className="custom_class">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
