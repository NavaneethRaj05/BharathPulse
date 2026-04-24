const mongoose = require('mongoose');
require('dotenv').config();
const Complaint = require('./models/Complaint');

async function updateFeedbackNames() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const complaints = await Complaint.find({ 'feedback.reporterContact': 'anonymous' });
    console.log(`Found ${complaints.length} complaints with anonymous feedback.`);

    let updatedCount = 0;
    for (const complaint of complaints) {
      let modified = false;
      const reporterName = complaint.reporters?.[0]?.name || 'Citizen';

      complaint.feedback.forEach(f => {
        if (f.reporterContact === 'anonymous') {
          f.reporterContact = reporterName;
          modified = true;
        }
      });

      if (modified) {
        await complaint.save();
        updatedCount++;
      }
    }

    console.log(`Updated feedback for ${updatedCount} complaints.`);
  } catch (error) {
    console.error('Error updating feedback:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateFeedbackNames();
