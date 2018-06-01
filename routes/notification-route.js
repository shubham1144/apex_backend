var express = require('express'),
    router = express.Router(),
    notification_controller = require('./../controllers/notification-controller.js');


router.get('/notifications', notification_controller.fetchNotifications);

router.get('/notifications/status_codes', notification_controller.fetchNotificationStatusCodes);

router.get('/notifications/:notification_id', notification_controller.fetchNotification);

router.post('/notifications', notification_controller.addNotification);

router.post('/notifications/:notification_id/call_logs', notification_controller.addCallLog);

router.put('/notifications/:notification_id/call_logs', notification_controller.updateCallLog);


module.exports = router;