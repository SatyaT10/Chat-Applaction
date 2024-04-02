const User = require('../models/userModel');
const bcrypt = require('bcrypt')
const Chat = require('../models/chatModel');
const Group = require('../models/groupModel');
const Member = require('../models/memberModel');
const mongoose = require('mongoose');
const GroupChat = require('../models/groupChatModel')

const loadRegister = async (req, res) => {
    try {
        res.render('register')
    } catch (error) {
        console.log(error.message);
    }
}

const registerUser = async (req, res) => {
    try {
        const reqBody = req.body;
        const { name, email, password } = reqBody;
        const iamge = req.file.filename;
        if (!name || !email || !password || !iamge)
            return res.render('register', { message: 'All fields are required' });
        const passwordHash = await bcrypt.hash(password, 10);
        let user = await User.findOne({ email: email });
        if (!user) {
            await User.create({
                name: name,
                email: email,
                image: `images/${iamge}`,
                password: passwordHash
            });
            res.render('register', { message: 'Your Registation has Completed Successfully!' })
        }
        else {
            res.render('register', { message: 'This Email is already registered' });
        }

    } catch (error) {

    }
}

const loginLoad = async (req, res) => {
    try {
        res.render('login')

    } catch (error) {
        console.log(error.message);
    }
}

const loginUser = async (req, res) => {
    try {
        const reqBody = req.body;
        const { email, password } = reqBody;
        if (!email || !password)
            return res.render('login', { message: "All fields are required!" });
        const user = await User.findOne({ email: email });
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                req.session.user = user;
                res.cookie('user', JSON.stringify(user));
                res.redirect('/dashboard');
            } else {
                res.render('login', { message: "Email or Password is Wrong!" });
            }
        } else {
            res.render('login', { message: "Email or Password is Wrong!" });
        }
    } catch (error) {
        console.log(error.message);
    }
}


const logout = async (req, res) => {
    try {
        res.clearCookie('user');
        req.session.destroy();
        res.redirect('/');

    } catch (error) {
        console.log(error.message);
    }
}


const loadDashboard = async (req, res) => {
    try {
        const allUser = await User.find({ _id: { $nin: [req.session.user._id] } });

        res.render("dashboard", { user: req.session.user, users: allUser });
    } catch (error) {
        console.log(error.message);
    }
}

const saveChat = async (req, res) => {
    try {
        const reqBody = req.body;
        const { sender_id, receiver_id, message } = reqBody;

        const newChat = await Chat.create({
            sender_id: sender_id,
            receiver_id: receiver_id,
            message: message,
        })
        res.status(200).send({ success: true, msg: " Chat inserted! ", data: newChat });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message })
    }
}

const deleteChat = async (req, res) => {
    try {
        const reqBody = req.body.id;
        const { id } = reqBody;
        await Chat.deleteOne({ _id: id });
        res.status(200).send({ success: true })
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message })
    }
}

const updateChat = async (req, res) => {
    try {
        const reqBody = req.body;
        const { id, message } = reqBody;
        await Chat.findOneAndUpdate({ _id: id }, {
            $set: {
                message: message
            }
        });
        res.status(200).send({ success: true })
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message })
    }
}

const loadGroups = async (req, res) => {
    try {
        const creater_id = req.session.user._id

        const groups = await Group.find({ creater_id: creater_id });
        res.render('group', { groups: groups });
    } catch (error) {
        console.log(error.message);
    }
}

const creatGroups = async (req, res) => {
    try {
        const reqBody = req.body;
        const image = req.file.filename
        const creater_id = req.session.user._id;
        const { name, limit } = reqBody;
        if (!name || !limit || !image || !creater_id)
            return res.render('group', { message: 'All field are requried!' });

        await Group.create({
            creater_id: creater_id,
            name: name,
            limit: limit,
            image: image
        });
        const groups = await Group.find({ creater_id: creater_id });
        res.render('group', { message: name + ' Group created Successfully!', groups: groups });

    } catch (error) {
        console.log(error.message);
    }
}

const getMember = async (req, res) => {
    try {
        const userId = req.session.user._id
        const users = await User.aggregate([
            {
                $lookup: {
                    from: "members",
                    localField: "_id",
                    foreignField: "user_id",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: ["$group_id", new mongoose.Types.ObjectId(req.body.group_id)]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "member"
                }
            },
            {
                $match: {
                    '_id': {
                        $nin: [new mongoose.Types.ObjectId(userId)]
                    }
                }
            }
        ])
        res.status(200).send({ success: true, data: users })
    } catch (error) {
        console.log(error.message);
    }
}

const addMember = async (req, res) => {
    try {
        const reqBody = req.body;
        const { members, group_id } = reqBody;

        if (!members) {

            return res.status(200).send({ success: false, msg: "Please select any one member!" });

        } else if (req.body.members.length > parseInt(req.body.limit)) {

            return res.status(200).send({ success: false, msg: "You can not select more then  " + req.body.limit + " members!" });

        } else {

            await Member.deleteMany({ group_id: group_id });

            const data = [];

            for (let i = 0; i < members.length; i++) {
                data.push({
                    group_id: group_id,
                    user_id: members[i]
                });
            }
            await Member.insertMany(data);
            return res.status(200).send({ success: true, msg: "Members add successfully!" })
        }
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message })
    }
}


const updateChatGroups = async (req, res) => {
    try {
        if (parseInt(req.body.limit) < parseInt(req.body.last_limit)) {
            await Member.deleteMany({ group_id: req.body.id });
        }
        var updateObj;
        if (req.file != undefined) {
            updateObj = {
                name: req.body.name,
                image: req.file.filename,
                limit: req.body.limit,
            }
        } else {
            updateObj = {
                name: req.body.name,
                limit: req.body.limit
            }
        }
        await Group.findOneAndUpdate({ _id: req.body.id }, {
            $set: updateObj
        });

        res.status(200).send({ success: true, msg: "Chat group updated successfully!" })
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message })

    }
}


const deleteChatGroups = async (req, res) => {
    try {
        await Group.deleteOne({ _id: req.body.id });
        await Member.deleteMany({ group_id: req.body.id });
        res.status(200).send({ success: true, msg: "Chat group deleted successfully!" })
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message })

    }
}

const shareGroups = async (req, res) => {
    try {
        const groupData = await Group.findOne({ _id: req.params.id });
        if (!groupData) {
            res.render('error', { message: '404 not found!' });
        } else if (req.session.user == undefined) {
            res.render('error', { message: "You need to login to access the share url!" });
        } else {
            // var totalMembers = await Member.find({ group_id: req.params.id }).count();
            var totalMembers = await Member.countDocuments({ group_id: req.params.id });
            var avilable = groupData.limit - totalMembers;
            var isOwner = groupData.creater_id == req.session.user._id ? true : false;
            // var isJoined = await Member.find({ group_id: req.params.id, user_id: req.session.user._id }).count();
            var isJoined = await Member.countDocuments({ group_id: req.params.id, user_id: req.session.user._id });
            res.render('shareLink', { group: groupData, avilable: avilable, totalMembers: totalMembers, isOwner: isOwner, isJoined: isJoined });

        }
    } catch (error) {
        console.log(error);
    }
}

const joinGroup = async (req, res) => {
    try {
        await Member.create({
            group_id: req.body.group_id,
            user_id: req.session.user._id
        });

        res.send({ success: true, msg: "Congrates!" })
    } catch (error) {
        res.send({ success: false, msg: error.message });
    }
}


const groupChats = async (req, res) => {
    try {

        const myGroups = await Group.find({ creater_id: req.session.user._id })
        const joinedGroups = await Member.find({ user_id: req.session.user._id }).populate('group_id').exec();
        res.render('chat-group', { myGroups: myGroups, joinedGroups: joinedGroups });

    } catch (error) {
        console.log(error.message);
    }
}

const saveGroupChat = async (req, res) => {
    try {
        const newChat = await GroupChat.create({
            sender_id: req.body.sender_id,
            group_id: req.body.group_id,
            message: req.body.message
        });
        const cChat = await GroupChat.findOne({ _id: newChat._id }).populate("sender_id")
        res.send({ success: true, chat: cChat });
    } catch (error) {
        res.send({ success: false, msg: error.message });
    }
}

const loadGroupChat = async (req, res) => {
    try {

        let groupChats = await GroupChat.find({ group_id: req.body.group_id }).populate("sender_id");

        res.send({ success: true, chats: groupChats });
    } catch (error) {
        res.send({ success: false, msg: error.message });
    }
}


const deleteGroupChat = async (req, res) => {
    try {

        await GroupChat.deleteOne({ _id: req.body.id });
        res.send({ success: true, msg: 'Chat deleted' });
    } catch (error) {
        res.send({ success: false, msg: error.message });
    }
}

const updateGroupChat = async (req, res) => {
    try {
        await GroupChat.findOneAndUpdate(
            {
                _id: req.body.id
            },
            {
                $set:
                {
                    message: req.body.msg
                }
            });
        res.send({ success: true, msg: 'Chat updated' });
    } catch (error) {
        res.send({ success: false, msg: error.message });
    }
}

module.exports = {
    loadRegister,
    registerUser,
    loginLoad,
    loginUser,
    logout,
    loadDashboard,
    saveChat,
    deleteChat,
    updateChat,
    loadGroups,
    creatGroups,
    getMember,
    addMember,
    updateChatGroups,
    deleteChatGroups,
    shareGroups,
    joinGroup,
    groupChats,
    saveGroupChat,
    loadGroupChat,
    deleteGroupChat,
    updateGroupChat
}