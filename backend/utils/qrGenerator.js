const QRCode = require('qrcode');
const crypto = require('crypto');

class QRCodeService {
  // Generate unique ticket ID
  static generateTicketId(eventId, userId) {
    const data = `${eventId}-${userId}-${Date.now()}`;
    return crypto.createHash('md5').update(data).toString('hex').substring(0, 12).toUpperCase();
  }

  // Generate QR code for ticket
  static async generateQRCode(ticketData) {
    try {
      const qrData = JSON.stringify({
        ticketId: ticketData.ticketId,
        eventId: ticketData.eventId,
        userId: ticketData.userId,
        eventTitle: ticketData.eventTitle,
        userName: ticketData.userName,
        timestamp: ticketData.timestamp
      });

      const qrCode = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return qrCode;
    } catch (error) {
      throw new Error('QR code generation failed: ' + error.message);
    }
  }

  // Verify QR code data
  static verifyQRCode(qrData) {
    try {
      const data = JSON.parse(qrData);
      
      // Validate required fields
      const required = ['ticketId', 'eventId', 'userId', 'eventTitle', 'userName', 'timestamp'];
      for (const field of required) {
        if (!data[field]) {
          return { isValid: false, error: `Missing field: ${field}` };
        }
      }

      // Check if ticket is not expired (events can't be checked in after 1 day)
      const ticketTime = new Date(data.timestamp);
      const now = new Date();
      const diffHours = (now - ticketTime) / (1000 * 60 * 60);

      if (diffHours > 24) {
        return { isValid: false, error: 'Ticket has expired' };
      }

      return { isValid: true, data };
    } catch (error) {
      return { isValid: false, error: 'Invalid QR code data' };
    }
  }
}

module.exports = QRCodeService;