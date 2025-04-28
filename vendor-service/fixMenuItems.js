const mongoose = require('mongoose');
require('dotenv').config();

async function fixMenuItems() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const vendorSchema = new mongoose.Schema({}, { strict: false });
  const Vendor = mongoose.model('Vendor', vendorSchema, 'vendors');

  const vendors = await Vendor.find({});
  
  for (const vendor of vendors) {
    let updated = false;

    if (vendor.menu && Array.isArray(vendor.menu)) {
      vendor.menu.forEach((item) => {
        if (!item._id) {
          item._id = new mongoose.Types.ObjectId();
          if (item.outOfStock === undefined) item.outOfStock = false;
          if (item.todaysSpecial === undefined) item.todaysSpecial = false;
          updated = true;
        }
      });
    }

    if (updated) {
      vendor.markModified('menu');
      await vendor.save();
      console.log(`✅ Fixed vendor: ${vendor.name}`);
    }
  }

  console.log("🎯 All menu items updated successfully.");
  process.exit(0);
}

fixMenuItems().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
