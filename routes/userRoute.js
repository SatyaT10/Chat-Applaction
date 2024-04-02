const express = require('express');
const userRoute = express();
const session = require('express-session');
const { SESSION_SECRET } = process.env;
const auth = require('../middleware/auth');

const path = require('path');
const multer = require('multer');

const cors = require('cors')
userRoute.use(cors());

userRoute.use(express.json());
userRoute.use(express.urlencoded({ extended: true }));
const userController = require('../controllers/userController');

userRoute.use(session({ secret: SESSION_SECRET }))
const cookie = require('cookie-parser')

userRoute.use(cookie())
userRoute.set('view engine', 'ejs');
userRoute.set('views', './views');

userRoute.use(express.static('public'));

const storage = multer.diskStorage({
    destination:
        function (req, file, cb) {
            cb(null, path.join(__dirname, '../public/Images'));
        },
    filename:
        function (req, file, cb) {
            const name = Date.now() + '-' + file.originalname;
            cb(null, name)
        }
});
const groupImageStorage = multer.diskStorage({
    destination:
        function (req, file, cb) {
            cb(null, path.join(__dirname, '../public/Images/image'));
        },
    filename:
        function (req, file, cb) {
            const name = Date.now() + '-' + file.originalname;
            cb(null, name)
        }
});


const upload = multer({ storage: storage });

const uploadGroupImage = multer({ storage: groupImageStorage });

userRoute.get('/register', auth.isLogout, userController.loadRegister);

userRoute.post('/register', upload.single('image'), userController.registerUser)

userRoute.get('/', auth.isLogout, userController.loginLoad);

userRoute.post('/', userController.loginUser);

userRoute.get('/logout', auth.isLogin, userController.logout);

userRoute.get('/dashboard', auth.isLogin, userController.loadDashboard);

userRoute.post('/save-chat', userController.saveChat);

userRoute.post('/delete-chat', userController.deleteChat);

userRoute.post('/update-chat', userController.updateChat);

userRoute.get('/groups',auth.isLogin,userController.loadGroups);

userRoute.post('/groups',auth.isLogin,uploadGroupImage.single('image'),userController.creatGroups);

userRoute.post('/get-member',auth.isLogin,userController.getMember);

userRoute.post('/add-member',auth.isLogin,userController.addMember);

userRoute.post('/update-chat-groups',auth.isLogin,upload.single('image'),userController.updateChatGroups);

userRoute.post('/delete-chat-groups',auth.isLogin,userController.deleteChatGroups);

userRoute.get('/share-group/:id',userController.shareGroups);

userRoute.post('/join-group',userController.joinGroup);

userRoute.get('/group-chat',auth.isLogin,userController.groupChats);

userRoute.post('/group-chat-save',auth.isLogin,userController.saveGroupChat);

userRoute.post('/load-group-chat',auth.isLogin,userController.loadGroupChat);

userRoute.post('/delete-group-chat',auth.isLogin,userController.deleteGroupChat);

userRoute.post('/update-group-chat',auth.isLogin,userController.updateGroupChat);

userRoute.get('*', function (req, res) {
    res.redirect('/');
})

module.exports = userRoute;