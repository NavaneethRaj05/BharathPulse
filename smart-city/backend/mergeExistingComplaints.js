const mongoose = require('mongoose');
require('dotenv').config();
const Complaint = require('./models/Complaint');

async function mergeDuplicates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all complaints
    const complaints = await Complaint.find({}).sort({ createdAt: 1 });
    
    const uniqueMap = new Map();
    let mergedCount = 0;

    for (const c of complaints) {
      // Create a key based on title, category, and location (lower-cased for case insensitivity)
      const key = `${c.title.toLowerCase()}_${c.category}_${c.location.toLowerCase()}`;
      
      if (uniqueMap.has(key)) {
        // This is a duplicate! Merge it into the original one.
        const originalId = uniqueMap.get(key);
        const original = await Complaint.findById(originalId);
        
        if (original) {
          // Check if reporters need to be added
          let isModified = false;
          for (const rep of c.reporters) {
            // Add if not already present
            const alreadyExists = original.reporters.some(r => r.contact === rep.contact);
            if (!alreadyExists) {
              original.reporters.push(rep);
              original.reportCount += 1;
              isModified = true;
            }
          }
          
          if (isModified) {
            await original.save();
          }
          
          // Delete the duplicate
          await Complaint.findByIdAndDelete(c._id);
          console.log(`Merged and deleted duplicate: ${c.title} (${c._id}) -> into ${originalId}`);
          mergedCount++;
        }
      } else {
        // This is the first time we see this
        uniqueMap.set(key, c._id);
      }
    }

    console.log(`Successfully merged ${mergedCount} duplicate complaints!`);
  } catch (error) {
    console.error('Error merging:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected');
  }
}

mergeDuplicates();
