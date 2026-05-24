import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";

export default async function handler(req, res) {

  try {

    await connectToDB();

    const count = await User.countDocuments();

    return res.status(200).json({
      count
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message
    });

  }

}