import jwt from 'jsonwebtoken';
import config from 'config';

export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        if (email === process.env.SELLER_EMAIL && password === process.env.SELLER_PASSWORD) {
            const token = jwt.sign({ email, role: 'admin' }, config.get('jwtPrivateKey'), {
                expiresIn: '1d',
            });

            return res.json({ success: true, token });
        } 
        else {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } 
    catch (error) {
        // console.log(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const adminMe = async (req, res) => {
    try {
        const { email } = req.user;

        if (email !== process.env.SELLER_EMAIL) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        return res.json({
            success: true,
            admin: { email, name: 'Admin', role: 'admin' }
        });
    } 
    catch (error) {
        // console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};

