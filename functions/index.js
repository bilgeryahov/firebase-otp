const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const otplib = require('otplib');
const qrcode = require('qrcode');
const cors = require('cors')({
    origin: true
});

const SERVICE_ACCOUNT = {
    'type': 'service_account',
    'project_id': 'fir-otp-e9ded',
    'private_key_id': 'f98467ba4379ff48cae92bd423af8a7e92ecf1ce',
    'private_key': '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCyqyfg8wAZ4nCg\n/ZpJxJhmr8m7DMCfF1+aiCdvlILaCCA7za53gl108/b1VzR3iBq2RuuJR2tkmIM0\nD78g+MEButiUctPITdaYrSSvmvMEBWp7KkvlsYgzAu4yoTYMdy29Hyp4Prh5c1k7\nPNRcDzZaHxRShZUjv5OnSPYQBiGctUCTZRauS9IeYXmO7Amjpx+fatO5hwH3cqSZ\nj3YCBu14xMhZx43CC55t5suPYdzOh67FQfef1PJWb+2THgJSBLYMpHGX9dN3AnpI\nZJUqQLCJNq4lByYpUtWbSB2YLB9wzXor1bj5VoBpIT8p960u/wIEEaEgEZjxk/ER\nl1a9/I5ZAgMBAAECggEAHTwTQOQSEqoyGq2UZtijxT2jSRd7lyyIaK05orDOvmVQ\n/OgZUZXDvATFVnyn6Z0cHdI57RMCGAo6gbTH5dm+Hw3XLWcijyZpZD8EfzVf6TsH\notKXa6SicBJdLmyhfuWrVsQ4O0esALdmlOJNryiQEKwAM8aG0jwhKWCvXozaSB08\nRuV8ZBCFMCGC9/UFyhvd4U9nvuAiywyTA8M6b95TfoFKwvvrOyBTbHsuBxapNVDq\nEi7qGw3Akm8Qp+nGaMmc345UWYr4L8EQsJ/7XOEQG7gKXvE2gGHg6TG1CAfRcDJ4\nyDUyVdSODJlUuW4t7V2DNRt3Dd1tyyHY8UOFArUHWQKBgQDczuS+y1yTyA/+kVGn\nYp6vxLt89rykXPqQxRlBuKqm8yArIgOG9ZFdS9a7h+Kopw9WvOtrRl9TKLF1ZoAv\nkNrhwSsJ+a+oEl2Z1/+7k020wT/HlMRRa1yvQi+UYK2Ra0UqXhYhBqSYiyzjcgbY\nss2i2zqObmD2QyzIL/pQZwpvnQKBgQDPJPDxyAIVxg/mQ4nkzKAc8JTWuW9n/t6J\nusrsjvSQOK6lcoY6B1i2QfRPbdXIhjHHUDUekjVgiDHeUIjnKg9ZulKgKf52SemV\nf24BZp7VCm9J/oDv/ZXdIN9hDpqVCjOlt7bd9FInoKn5jysVQ04vOFdlvV07Z/Ny\nSZqtvgQC7QKBgBdlVJditMxzxj4S57P0nxvAnJ0BB7vinin4uFReXLaTzDTFxdnm\n6yAXiQkVvM5h5R4rpkYXjsIg7ayiz7I6hvakoQrNie8lAwXp/Q7C7NjaIQfkm2iF\nF6z6NlBibgGafBmhHnchXQ9Mr9TpoBAV4fP/hpTQ3TU6qOQNMViTkmeBAoGAI2tH\nn6/5W0vAkDjgLTUn84rXiFewyvFzj81WwVg4TSjEBBovBWEYNCHW6nX3ZhA8Fr6K\nNq39XoIrNL5EinJQqaEIW8aScht1S1C8uJSZeAgOu3I/Dcoog+UJDQl4OR/DcQSW\nyiDqo0f/iGKIlVwq1DwoBYd5l5zQrawUPL0O5okCgYEAisID5eh0QvgUcwAgDN4f\ntuEdjR3Wmg3dHdujmjzHYPdzd/t4Yl0hG7rzIjgpSqlPzo3Rfwq+ZPhraE/cK0HL\n5oOrVUuJXKkpwU7a9MODtvHLIiG27VD+rb4+KT7sL9ROw4Nbpxbcr6moTsA/XMr3\nb6+kKhoQY2D+8GYY4N/XD2k=\n-----END PRIVATE KEY-----\n',
    'client_email': 'firebase-adminsdk-rssuy@fir-otp-e9ded.iam.gserviceaccount.com',
    'client_id': '104145378449149969121',
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://oauth2.googleapis.com/token',
    'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
    'client_x509_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-rssuy%40fir-otp-e9ded.iam.gserviceaccount.com'
};

function promisify(func) {
    return (...args) => new Promise((resolve, reject) => func(...args, (error, data) => {
        if (error) return reject(error);
        return resolve(data);
    }));
}

admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT),
    databaseURL: 'https://fir-otp-e9ded.firebaseio.com'
});

exports.register = functions.https.onRequest((request, response) =>
    cors(request, response, () => {
        let email = request.body.email;
        let displayName = request.body.displayName;
        let secret = otplib.authenticator.generateSecret();
        admin.auth().createUser({
            email,
            displayName,
            password: crypto.randomBytes(20).toString('hex'),
            disabled: false
        })
            .then(user =>
                admin.database().ref(`/firebase-otp/${user.uid}`).set(secret)
            )
            .then(() =>
                promisify(qrcode.toDataURL)(otplib.authenticator.keyuri(email, 'firebase-otp', secret))
            )
            .then(data => response.status(201).json({
                success: true,
                message: `${email} successfully registered!`,
                data
            }))
            .catch(error => response.status(400).json({
                success: false,
                error: error.message
            }));
    }));

exports.authenticate = functions.https.onRequest((request, response) =>
    cors(request, response, () => {
        let email = request.body.email;
        let otp = request.body.otp;
        let uid = null;
        admin.auth().getUserByEmail(email)
            .then(user => {
                uid = user.uid;
                return admin.database().ref(`/firebase-otp/${uid}`).once('value');
            })
            .then(
                secret => secret.val()
            ).then(
                secretValue => otplib.authenticator.check(otp, secretValue)
            ).then(result => {
                if (result) return admin.auth().createCustomToken(uid);
                throw new Error('Unauthorized!');
            }).then(token => response.status(200).json({
                success: true,
                message: `${email} successfully authenticated!`,
                token
            })).catch(error => response.status(401).json({
                success: false,
                error: error.message
            }));
    }));
