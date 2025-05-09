import Address from "../models/address.js";

// export const createAddress = async (req, res) => {
//   try {
//     const { userId, fullname, company, country, city, state, phone, email } = req.body;
//     const address = new Address({ userId, fullname, company, country, city, state, phone, email });
//     await address.save();
//     res.status(201).json({ success: true, address });
//   } catch (error) {
//     res.status(400).json({ success: false, error: error.message });
//   }
// };

// export const getAddressesByUser = async (req, res) => {
//   try {
//     const addresses = await Address.find({ userId: req.params.userId });
//     res.json({ success: true, addresses });
//   } catch (error) {
//     res.status(400).json({ success: false, error: error.message });
//   }
// };



export const createAddress = async (req, res) => {
  try {
    // Debug: Check if req.user is defined
    console.log('req.user:', req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const userId = req.user._id; // Get userId from the JWT token
    const { fullname, company, country, city, state, phone, email } = req.body;

    // Validate required fields
    if (!fullname || !country || !city || !state || !phone || !email) {
      return res.status(400).json({ success: false, error: 'All required fields must be provided.' });
    }

    const address = new Address({
      userId,
      fullname,
      company,
      country,
      city,
      state,
      phone,
      email
    });

    await address.save();
    res.status(201).json({ success: true, address });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const userId = req.params.userId;
    const addresses = await Address.find({ userId });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};