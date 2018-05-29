/* Migration file associated with creation of users*/

module.exports = [
`
    ALTER TABLE Plans.Subscriptions.Domains.Forms.Enquiry (ADD eFirstName STRING)
`
];