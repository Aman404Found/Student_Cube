import User from "../models/User.js";
import ReferCode from "../models/ReferCode.js";

const DEFAULT_PAGE_SIZE = 20;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPaginationParams = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE, 1), DEFAULT_PAGE_SIZE);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const formatAmbassador = (user, referCode) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  college: user.collegeName,
  walletBalance: user.walletBalance || 0,
  payoutHistory: [...(user.payoutHistory || [])].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
  ),
  createdAt: user.createdAt,
  referCode: referCode?.code || null,
  totalReferred: referCode?.referredUsers?.length || 0,
});

const formatUserSearchResult = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  college: user.collegeName,
  role: user.role,
});

const normalizeAndValidateReferCode = (referCode) => {
  const normalizedReferCode = String(referCode || "").trim().toUpperCase();

  if (!/^[A-Z0-9_-]{3,24}$/.test(normalizedReferCode)) {
    return {
      error: "Refer code must be 3-24 characters and can use letters, numbers, hyphen, or underscore",
    };
  }

  return { normalizedReferCode };
};


export const getAmbassadorDashboard = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id; 

    const user = await User.findById(userId);
    const referCodeDoc = await ReferCode.findOne({ owner: userId });

    let totalPending = 0;
    let totalSuccessful = 0;

    if (referCodeDoc && referCodeDoc.referredUsers) {
      totalPending = referCodeDoc.referredUsers.filter(u => u.status === 'used').length;
      totalSuccessful = referCodeDoc.referredUsers.filter(u => u.status === 'successful').length;
    }

    res.status(200).json({
      success: true,
      data: {
        referCode: referCodeDoc ? referCodeDoc.code : null,
        totalPending: totalPending,           
        totalSuccessful: totalSuccessful,    
        walletBalance: user.walletBalance || 0,
        payoutHistory: user.payoutHistory || [] 
      }
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAmbassadorsAdmin = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const search = String(req.query.search || "").trim();
    const college = String(req.query.college || "").trim();
    const query = { role: "ambassador" };

    if (search) {
      const regex = escapeRegex(search);
      query.$or = [
        { name: { $regex: regex, $options: "i" } },
        { email: { $regex: regex, $options: "i" } },
      ];
    }

    if (college && college !== "All Colleges") {
      query.college = college;
    }

    const [ambassadors, total] = await Promise.all([
      User.find(query)
        .select("name username email collegeName walletBalance payoutHistory createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const referCodes = await ReferCode.find({
      owner: { $in: ambassadors.map((ambassador) => ambassador._id) },
    });
    const referCodesByOwner = new Map(
      referCodes.map((referCode) => [referCode.owner.toString(), referCode]),
    );

    res.status(200).json({
      success: true,
      count: ambassadors.length,
      total,
      pagination: {
        page,
        limit,
        hasMore: skip + ambassadors.length < total,
      },
      data: ambassadors.map((ambassador) => {
        const referCodeDoc = referCodesByOwner.get(ambassador._id.toString());
        
        let totalPending = 0;
        let totalSuccessful = 0;

        if (referCodeDoc && referCodeDoc.referredUsers) {
          totalPending = referCodeDoc.referredUsers.filter(u => u.status === 'used').length;
          totalSuccessful = referCodeDoc.referredUsers.filter(u => u.status === 'successful').length;
        }

        return {
          _id: ambassador._id,
          name: ambassador.name,
          username: ambassador.username,
          email: ambassador.email,
          college: ambassador.college,
          referCode: referCodeDoc ? referCodeDoc.code : null,
          totalPending: totalPending,       
          totalSuccessful: totalSuccessful,  
          walletBalance: ambassador.walletBalance || 0,
          payoutHistory: ambassador.payoutHistory || [],
          createdAt: ambassador.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching ambassadors for admin:", error);
    res.status(500).json({ success: false, message: "Failed to fetch ambassadors" });
  }
};

export const addAmbassadorPayoutAdmin = async (req, res) => {
  try {
    const { ambassadorId } = req.params;
    const amount = Number(req.body.amount);
    const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();
    const transactionId = String(req.body.transactionId || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Please provide a valid payout amount" });
    }

    if (!transactionId) {
      return res.status(400).json({ success: false, message: "Please provide a transaction id" });
    }

    if (Number.isNaN(paidAt.getTime())) {
      return res.status(400).json({ success: false, message: "Please provide a valid payout time" });
    }

    // BUG-015 Fix: Atomic update to prevent over-withdrawal race condition
    const ambassador = await User.findOneAndUpdate(
      { _id: ambassadorId, role: "ambassador", walletBalance: { $gte: amount } },
      {
        $inc: { walletBalance: -amount },
        $push: {
          payoutHistory: {
            amount,
            paidAt,
            transactionId,
            note: req.body.note ? String(req.body.note).trim() : undefined,
          },
        },
      },
      { new: true }
    );

    if (!ambassador) {
      const existing = await User.findOne({ _id: ambassadorId, role: "ambassador" });
      if (!existing) {
        return res.status(404).json({ success: false, message: "Ambassador not found" });
      }
      return res.status(400).json({ success: false, message: "Payout amount cannot exceed wallet balance" });
    }

    const referCode = await ReferCode.findOne({ owner: ambassador._id });

    res.status(200).json({
      success: true,
      message: "Payout record added successfully",
      data: formatAmbassador(ambassador, referCode),
    });
  } catch (error) {
    console.error("Error adding ambassador payout:", error);
    res.status(500).json({ success: false, message: "Failed to add payout record" });
  }
};

export const searchUsersForAmbassadorAdmin = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    if (search.length < 2) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const regex = escapeRegex(search);
    const users = await User.find({
      role: "user",
      $or: [
        { name: { $regex: regex, $options: "i" } },
        { email: { $regex: regex, $options: "i" } },
      ],
    })
      .select("name username email collegeName role")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(formatUserSearchResult),
    });
  } catch (error) {
    console.error("Error searching users for ambassador:", error);
    res.status(500).json({ success: false, message: "Failed to search users" });
  }
};

export const createAmbassadorAdmin = async (req, res) => {
  try {
    const { userId, referCode } = req.body;
    const { normalizedReferCode, error } = normalizeAndValidateReferCode(referCode);

    if (!userId) {
      return res.status(400).json({ success: false, message: "Please select a user" });
    }

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Admins cannot be converted to ambassadors" });
    }

    if (user.role === "ambassador") {
      return res.status(400).json({ success: false, message: "User is already an ambassador" });
    }

    const existingReferCode = await ReferCode.findOne({ code: normalizedReferCode });
    if (existingReferCode) {
      return res.status(400).json({ success: false, message: "Refer code is already assigned" });
    }

    user.role = "ambassador";
    user.promoCode = normalizedReferCode;
    await user.save();

    const createdReferCode = await ReferCode.create({
      code: normalizedReferCode,
      owner: user._id,
      referredUsers: [],
    });

    res.status(201).json({
      success: true,
      message: "Ambassador created successfully",
      data: formatAmbassador(user, createdReferCode),
    });
  } catch (error) {
    console.error("Error creating ambassador:", error);

    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: "Refer code is already assigned" });
    }

    res.status(500).json({ success: false, message: "Failed to create ambassador" });
  }
};

export const assignAmbassadorReferCodeAdmin = async (req, res) => {
  try {
    const { ambassadorId } = req.params;
    const { normalizedReferCode, error } = normalizeAndValidateReferCode(req.body.referCode);

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const ambassador = await User.findOne({ _id: ambassadorId, role: "ambassador" });
    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    const existingOwnerCode = await ReferCode.findOne({ owner: ambassador._id });
    if (existingOwnerCode) {
      return res.status(400).json({ success: false, message: "This ambassador already has a refer code" });
    }

    const existingReferCode = await ReferCode.findOne({ code: normalizedReferCode });
    if (existingReferCode) {
      return res.status(400).json({ success: false, message: "Refer code is already assigned" });
    }

    ambassador.promoCode = normalizedReferCode;
    await ambassador.save();

    const createdReferCode = await ReferCode.create({
      code: normalizedReferCode,
      owner: ambassador._id,
      referredUsers: [],
    });

    res.status(200).json({
      success: true,
      message: "Refer code assigned successfully",
      data: formatAmbassador(ambassador, createdReferCode),
    });
  } catch (error) {
    console.error("Error assigning ambassador refer code:", error);

    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: "Refer code is already assigned" });
    }

    res.status(500).json({ success: false, message: "Failed to assign refer code" });
  }
};

export const demoteAmbassadorAdmin = async (req, res) => {
  try {
    const { ambassadorId } = req.params;

    const ambassador = await User.findOne({ _id: ambassadorId, role: "ambassador" });
    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    await ReferCode.deleteOne({ owner: ambassador._id });
    ambassador.role = "user";
    ambassador.promoCode = undefined;
    await ambassador.save();

    res.status(200).json({
      success: true,
      message: "Ambassador demoted successfully",
    });
  } catch (error) {
    console.error("Error demoting ambassador:", error);
    res.status(500).json({ success: false, message: "Failed to demote ambassador" });
  }
};
