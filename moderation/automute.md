# auto mute

auto mute will be configured by default to mute members for an increasing amount of time when they
violate the chat filter

## configuring auto mute

auto mute can be configured using the `$automute` command, values of '0' will not mute the user at
that violation level, however setting a value of 'none', will use the next lowest available time.

### vl expire

this is the amount of time it takes for filter violations to expire. for example, if set to 1 day,
the amount of punishments a user has received from automute will be reset, so they will start from
VL 0.

the [nypsi server](https://discord.gg/hJTDNST) uses an expiry of 30 days

## how do violation levels work

each hour, a member's violation level will be reset. everytime they violate the chat filter they vl
(violations) will go up by one.

if their vl has a hit against the auto mute configuration, they will be muted for that amount of
time. if there is no value associated with their current vl level, nypsi will use the next lowest
available option.
