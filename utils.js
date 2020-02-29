/*jshint esversion: 8 */
const { wholesome } = require("./images.json");
const fs = require("fs");
const balance = JSON.parse(fs.readFileSync("./users.json"));

module.exports = {
    getMember: function(message, memberName) {
        let target = message.guild.members.find(member => {
            if (member.user.tag.slice(0, -5).toLowerCase() == memberName.toLowerCase()) {
                return member;
            }
        });

        if (!target) {
            target = message.guild.members.find(member => {
                return member.displayName.toLowerCase().includes(memberName.toLowerCase()) || member.user.tag.toLowerCase().includes(memberName.toLowerCase());
            });
        }

        if (!target) {
            target = message.guild.members.find(member => {
                return member.user.id == memberName;
            });
        }

        return target;
    },
    
    formatDate: function(date) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Intl.DateTimeFormat("en-US", options).format(date);
    },

    wholesomeImg: function() {
        return wholesome[Math.floor(Math.random() * wholesome.length)];
    },

    getMention: function(message, memberMention) {
        if (!memberMention) return;

        if (memberMention.startsWith("<@") && memberMention.endsWith(">")) {
            memberMention = memberMention.slice(2, -1);
            if (memberMention.startsWith('!')) {
                memberMention = memberMention.slice(1);
            }

            return message.guild.members.get(memberMention);
        }
    },

    getBalance: function(member) {
        return balance[member.user.id].balance
    },

    createUser: function(member) {
        balance[member.user.id] = {
            balance: 100
        }

        fs.writeFile("./users.json", JSON.stringify(balance), (err) => {
            if (err) {
                console.log(err)
            }
        })
    }
};
