const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

exports.sendMessage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { senderId, receiverId, messageText } = req.body;

    if (!senderId || !receiverId || !messageText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const db = admin.firestore();
      await db.collection('messages').add({
        senderId,
        receiverId,
        messageText, 
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isRead: false,
      });

      return res.status(200).json({ message: 'Message sent successfullys' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

exports.doctorLogin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { email, password, sessionId, token } = req.body;

    if (!email || !password || !sessionId || !token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const userQuery = await db.collection('users')
        .where('email', '==', trimmedEmail)
        .get();

      if (userQuery.empty) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();

      //const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const hashedPassword = password

      if (userData.passhash !== hashedPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (userData.role !== 1) {
        return res.status(403).json({ error: 'Only doctors can log in' });
      }

      await db.collection('sessions').doc(sessionId).set({
        userId: userDoc.id,
        token,
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, 
      });

      return res.status(200).json({
        success: true,
        user: {
          id: userDoc.id,
          firstname: userData.firstname.trim(),
          surname: userData.surname.trim(),
          email: userData.email,
          specialization: userData.specialization || 'Unknown',
          role: userData.role,
        }
      });
    } catch (err) {
      console.error('[doctorLogin]', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

exports.getPatientFiles = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'Missing patientId' });
    }

    try {
      const filesQuery = await db
        .collection('patientFiles')
        .where('patientId', '==', patientId)
        .get();

      const files = filesQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ success: true, files });

    } catch (error) {
      console.error('[getPatientFiles]', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});
