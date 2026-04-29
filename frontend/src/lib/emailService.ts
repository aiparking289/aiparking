import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_placeholder';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_placeholder';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key_placeholder';

export const sendBookingAcknowledgement = async (
  userName: string,
  userEmail: string,
  userPhone: string,
  slotLabel: string
) => {
  try {
    const templateParams = {
      name: userName,
      to_name: userName,
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
      slot_label: slotLabel,
      title: `Parking Slot ${slotLabel}`,
      message: `Your parking slot ${slotLabel} has been successfully booked.`,
      booking_time: new Date().toLocaleString(),
      reply_to: 'support@asystem.com',
    };

    console.log('Sending email with params:', templateParams);
    console.log('Service ID:', EMAILJS_SERVICE_ID);
    console.log('Template ID:', EMAILJS_TEMPLATE_ID);
    console.log('Public Key:', EMAILJS_PUBLIC_KEY ? 'Present' : 'Missing');

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Email sent successfully via EmailJS!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send email via EmailJS:', error);
    throw error;
  }
};
