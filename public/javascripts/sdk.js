!function () {
    var NotifyME = {
        //$forms: null,
        $submitButtons: null,
        $submitInputs: null,
        href: null,
        hostname: null,
        restURL: null,
        requestObj: null,
        allowSubmit: null,
        init: function () {
            //NotifyME.$forms         = document.getElementsByTagName("form");
            NotifyME.$submitButtons = document.querySelectorAll("button[type=submit]");
            NotifyME.$submitInputs  = document.querySelectorAll("input[type=submit]");
            NotifyME.restURL        = 'http://notify.me.1020dev.com/hit';
            NotifyME.href           = encodeURIComponent(window.location.href);
            NotifyME.hostname       = window.location.hostname;
            NotifyME.allowSubmit    = false;
            if (NotifyME.$submitButtons.length) {
                for (var i = 0; i < NotifyME.$submitButtons.length; i++) {
                    NotifyME.$submitButtons[i].addEventListener("click", NotifyME.makeRequest, true);
                }
            }
            if (NotifyME.$submitInputs.length) {
                for (var i = 0; i < NotifyME.$submitInputs.length; i++) {
                    NotifyME.$submitInputs[i].addEventListener("click", NotifyME.makeRequest, true);
                }
            }
            /*for (var i = 0; i < NotifyME.$forms.length; i++) {
                NotifyME.$forms[i].addEventListener("click", NotifyME.makeRequest);
            }*/
            NotifyME.setRequestObject();
        },
        makeRequest: function (event) {
            if (NotifyME.allowSubmit) {
                NotifyME.allowSubmit = false;
                return true;
            }
            event.preventDefault();
            var $button = event.currentTarget;
            var $form    = NotifyME.closest($button);
            var formData = {};
            for (var i = 0; i < $form.elements.length; i++) {
                var item            = $form.elements.item(i);
                formData[item.name] = item.value;
            }
            formData['href-notify']     = NotifyME.href;
            formData['hostname-notify'] = NotifyME.hostname;
            NotifyME.requestObj.open("POST", NotifyME.restURL, true);
            NotifyME.requestObj.send(JSON.stringify(formData));
            NotifyME.allowSubmit = true;
            $button.click();
            //$form.submit();
        },
        closest: function (el) {
            var selector = 'form';
            while (el) {
                if (el.matches(selector)) {
                    return el;
                }
                el = el.parentElement;
            }
            return null;
        },
        setRequestObject: function () {
            if (typeof XMLHttpRequest != "undefined") {
                NotifyME.requestObj = new XMLHttpRequest;
            } else {
                for (var n = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"], o = 0, p = n.length; p > o; o++) {
                    try {
                        NotifyME.requestObj = new ActiveXObject(n[o]);
                        break;
                    } catch (i) {
                    }
                }
            }
        }
    };
    NotifyME.init();
}();