const ics = require('ics');
const { writeFileSync } = require('fs');
const path = require('path');

class CalendarService {
  // Generate iCal file for an event
  static generateICalEvent(event, user) {
    try {
      const eventDate = new Date(event.date);
      const eventTime = event.time.split(':');
      
      const start = [
        eventDate.getFullYear(),
        eventDate.getMonth() + 1,
        eventDate.getDate(),
        parseInt(eventTime[0]),
        parseInt(eventTime[1])
      ];

      // Assume event duration of 2 hours by default
      const end = [
        eventDate.getFullYear(),
        eventDate.getMonth() + 1,
        eventDate.getDate(),
        parseInt(eventTime[0]) + 2,
        parseInt(eventTime[1])
      ];

      const icsEvent = {
        start,
        end,
        title: event.title,
        description: event.description,
        location: event.venue,
        url: event.registrationLink || '',
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        organizer: {
          name: event.organizer?.name || 'CampBuzz',
          email: event.organizer?.email || 'noreply@campbuzz.com'
        },
        alarms: [
          {
            action: 'display',
            description: 'Reminder',
            trigger: { hours: 1, minutes: 0, before: true }
          }
        ]
      };

      return icsEvent;
    } catch (error) {
      throw new Error('Failed to generate calendar event: ' + error.message);
    }
  }

  // Create .ics file for download
  static createICSFile(event, user) {
    return new Promise((resolve, reject) => {
      const icsEvent = this.generateICalEvent(event, user);
      
      ics.createEvent(icsEvent, (error, value) => {
        if (error) {
          reject(error);
          return;
        }

        // Create filename
        const filename = `campbuzz-event-${event._id}-${Date.now()}.ics`;
        const filepath = path.join(__dirname, '../temp', filename);

        // Ensure temp directory exists
        const fs = require('fs');
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Write file
        writeFileSync(filepath, value);

        resolve({
          filename,
          filepath,
          content: value
        });
      });
    });
  }

  // Generate Google Calendar URL
  static generateGoogleCalendarUrl(event) {
    const eventDate = new Date(event.date);
    const eventTime = event.time.split(':');
    
    const startTime = new Date(eventDate);
    startTime.setHours(parseInt(eventTime[0]), parseInt(eventTime[1]));
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2); // 2 hours duration

    const formatDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description,
      location: event.venue,
      dates: `${formatDate(startTime)}/${formatDate(endTime)}`
    });

    if (event.registrationLink) {
      params.append('add', event.registrationLink);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // Generate Outlook Calendar URL
  static generateOutlookCalendarUrl(event) {
    const eventDate = new Date(event.date);
    const eventTime = event.time.split(':');
    
    const startTime = new Date(eventDate);
    startTime.setHours(parseInt(eventTime[0]), parseInt(eventTime[1]));
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2);

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      body: event.description,
      location: event.venue,
      startdt: startTime.toISOString(),
      enddt: endTime.toISOString()
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  // Generate Apple Calendar data
  static generateAppleCalendarData(event) {
    const eventDate = new Date(event.date);
    const eventTime = event.time.split(':');
    
    const startTime = new Date(eventDate);
    startTime.setHours(parseInt(eventTime[0]), parseInt(eventTime[1]));
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2);

    const icsEvent = this.generateICalEvent(event);
    const { error, value } = ics.createEvent(icsEvent);

    if (error) {
      throw new Error('Failed to generate Apple Calendar data: ' + error);
    }

    return value;
  }
}

module.exports = CalendarService;