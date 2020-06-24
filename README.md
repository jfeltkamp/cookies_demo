


## <a name="service-activation"></a>Processing consent, activation of 3rd-party services

In the [code example above](#manage-event) you see how to catch the event and distribute the users consents to the 
individual service activation. Here we want to have a look on how to handle the 3rd-party service activation. The
content of the functions provided in the dispatcher event (activate and fallback). 

In order to effectively suppress 3rd party cookies, the resources must already be switched off in the supplied source 
code. I.e. that corresponding script tags or iframes (these are the most common use cases) have to be manipulated so 
that they do not work. => We have to find a reversible knock-out technique.

What the ```activate()``` function has to do is to reanimate the service.

What the ```fallback()``` function has to do is to repair gaps in the layout, inform user, that something is missing, or
ask again if he now wants to activate the service.

### Reversible knock-outs for ```<script>``` and ```<iframe>```
`````html
<!-- before -->
<script src="https://ext-service.net/js/install_many_cookies.js"></script>
<!-- after (knocked out javascript) -->
<script src="https://ext-service.net/js/install_many_cookies.js" data-sid="extservice" type="text/plain"></script>

<!-- before -->
<iframe src="https://www.youtube.com/embed/XGT82nnmF4c" width="560" height="315"></iframe>
<!-- after (knocked out iframe) -->
<iframe src="/path/to/myIframeFallback.html" data-sid="youtube" data-src="https://www.youtube.com/embed/XGT82nnmF4c" width="560" height="315"></iframe>
`````

### Re-animation of knocked out services

````js
var dispatch = {
  extservice: {
    activate: function() {
      jQuery('script[data-sid="extservice"]').each(function() {
        var replacement = jQuery(this).clone().removeAttr('type');
        jQuery(this).replaceWith(replacement.html());
      });
    },
    fallback: function() {
      // No need.
    }
  },
  youtube: {
    activate: function() {
      jQuery('iframe[data-sid="youtube"]').each(function() {
        jQuery(this).attr('src', jQuery(this).data('src'));
      });
    },
    fallback: function() {
      jQuery('iframe[data-sid="youtube"]').parent().prepend(jQuery('<div>Sorry, but YouTube disabled.</div>'))
    }
  }
}
````

## En-/disable 3rd-party services from anywhere

It is possible to activate third party services from anywhere on the website. It is not necessary to open the cookie 
widget for this. It just has to be fired a Javascript event ```cookiesjsrSetService```.

Suppose you have a link on the page that should be used to activate the Matomo service...
