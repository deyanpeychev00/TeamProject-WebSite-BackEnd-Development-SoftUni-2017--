const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');
const encryption = require('./../utilities/encryption');



module.exports = {
    registerGet: (req, res) => {
        res.render('user/register');
    },

    registerPost:(req, res) => {
        let registerArgs = req.body;
        let password = registerArgs.password.toString();
        let fullName = registerArgs.fullName.toString();
        let email = registerArgs.email.toString();
        let isnum = /^\d+$/.test(fullName);
        let isEmailValid = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);

        User.findOne({email: registerArgs.email}).then(user => {
            let errorMsg = '';
            if (user) {
                errorMsg = 'User with the same username exists!';
            } else if (registerArgs.password !== registerArgs.repeatedPassword) {
                errorMsg = 'Passwords do not match!'
            }
            else if (password.length < 6){
                errorMsg = 'Password must be at least 6 symbols long';
            }
            else if(isnum){
                errorMsg='Username must have at least one symbol that is not digit';
            }
            else if(!isEmailValid){
                errorMsg='Invalid email';
            }
            if (errorMsg) {
                registerArgs.error = errorMsg;
                res.render('user/register', registerArgs)
            } else {
                let salt = encryption.generateSalt();
                let passwordHash = encryption.hashPassword(registerArgs.password, salt);



                let roles = [];
                Role.findOne({name: 'User'}).then(role => {
                    let roleName = role.name;
                    roles.push(role.id);

                    let userObject = {
                        email: registerArgs.email,
                        passwordHash: passwordHash,
                        fullName: registerArgs.fullName,
                        salt: salt,
                        roles: roles,
                        roleName: roleName,
                        articles: []
                    };
                    User.create(userObject).then(user => {
                        role.users.push(user.id);
                        role.save(err =>{
                            if(err){
                                res.render('user/register', {error: err.message});
                            } else {
                                req.logIn(user, (err) => {
                                    if (err) {
                                        registerArgs.error = err.message;
                                        res.render('user/register', registerArgs);
                                        return;
                                    }
                                    res.redirect('/');
                                })
                            }
                        })

                    });
                });
            }
        })
    },

    loginGet: (req, res) => {
        res.render('user/login');
    },

    loginPost: (req, res) => {
        let loginArgs = req.body;
        User.findOne({email: loginArgs.email}).then(user => {
            if (!user ||!user.authenticate(loginArgs.password)) {
                let errorMsg = 'Either username or password is invalid!';
                loginArgs.error = errorMsg;
                res.render('user/login', loginArgs);
                return;
            }

            req.logIn(user, (err) => {
                if (err) {
                    console.log(err);
                    res.redirect('/user/login', {error: err.message});
                    return;
                }

                res.redirect('/');
            })
        })
    },

    logout: (req, res) => {
        req.logOut();
        res.redirect('/');
    },

    detailsGet: (req, res) =>{
        let user = req.user;
        user.articles = user.articles.sort((a,b) => a.date <= b.date);

        res.render('user/details', {user: user});
    },

    settingsGet: (req, res) =>{
        let id = req.params.id;
        User.findById(id).then(user => {
            res.render('user/settings', {user: user});
        });
    },

    settingsPost: (req, res) => {

    }
};
