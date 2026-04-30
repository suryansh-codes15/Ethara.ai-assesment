const sanitize = require("xss-clean");

const enterpriseSecurity = (app) => {
  // Prevent XSS attacks
  app.use(sanitize());

  // Strict Content Security Policy
  const helmet = require("helmet");
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://avatar.vercel.sh"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "*"]
    }
  }));

  // Prevent parameter pollution
  const hpp = require("hpp");
  app.use(hpp());
};

module.exports = enterpriseSecurity;
