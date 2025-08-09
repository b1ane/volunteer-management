// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = (to, token) => {
  const verificationUrl = `http://localhost:5000/verify-email?token=${token}`;
  const mailOptions = {
    from: `"Volunteer App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify Your Email',
    html: `
      <h3>Email Verification</h3>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify My Email</a>
    `
  };

  return transporter.sendMail(mailOptions)
  .then(info => {
    console.log('Verification email sent:', info.response);
  })
  .catch(error => {
    console.error('Error sending email:', error);
  });

};

module.exports = sendVerificationEmail;
