import axios from "axios";

const sendEmail = async (to, subject, text, html = null) => {
  try {
    const payload = {
      sender: {
        name: "SentiAware",
        // This must be the email address you verify on Brevo!
        email: process.env.EMAIL_USER, 
      },
      to: [
        {
          email: to,
        },
      ],
      subject: subject,
      textContent: text,
    };

    if (html) {
      payload.htmlContent = html;
    }

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      payload,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Brevo Email Error:",
      error.response ? error.response.data : error.message
    );
    throw new Error(
      error.response && error.response.data.message
        ? error.response.data.message
        : "Email failed to send."
    );
  }
};

export default sendEmail;
