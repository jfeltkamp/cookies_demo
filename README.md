# COOKiES Demo

## Introduction
The COOKiES module prevents the installation of cookies in accordance with the GDPR until the user has given his consent that cookies may be installed. There are many third-party integration modules on Drupal.org that have gotten into a dilemma due to the newer GDPR: They can only be used in compliance with GDPR if they could connect to user-consent management, which it not yet exist within the Drupal API. There are many external Drupal user consent management systems that independently integrate third-party services. If you use these external Drupal tools, you would have to do without the configurability, authorizations and control that are provided by corresponding third-party integration modules (Contrib modules). - The COOKiES module closes this gap by providing user consent management within the Drupal API.

In principle, developers of third-party integration modules could connect their modules directly to the COOKiES consent management; Of course they wouldn't do that as long as COOKiES is not in the Drupal core. However, there is an alternative to bridge the gap between a third-party-integration module and the COOKiES module: namely by means of an additional bridge module that intercepts third-party integration within the Drupal API (knock-out) and re-animates as soon as the user has given his consent in the COOKiES UI. - In this way, the third-party integration module remains independent of COOKiES and can still use its user consent management.

The COOKiES Demo Module should show how this works and help to create your own bridge modules.

## What has a bridge module to do to connect my third-party-integration module to COOKiES?

1. In the COOKiES UI, a new user decision for my third-party-integration module must be added.
2. The third-party integration must be effectively intercepted (knock-out).
3. The third-party integration must be reactivated after the user has given consent (re-animation) - without negatively affecting its function.

### 1. Add a service requiring approval
To add another point to the list of services requiring approval in the COOKiES UI, all you need is a "cookies.cookies_service" type of config entity, which is stored in the "config / install" folder of the bridge module. (see example)

### 2. Knock-out the third-party integration
An effective knock-out of third-party integration can only take place on the server side. Third-party cookies are installed (essentially) in two ways: either by a JavaScript that is loaded from a remote server, or by an iframe, that loads its contents from a remote server.
In order to prevent the execution of a JavaScript, it is sufficient to set the attribute ```type="text/plain"``` to the script tag. This way, all content stays as it is, and it's easy to re-animate the Javascript later.

`````html
<!-- before -->
<script src="https://ext-service.net/js/install_many_cookies.js"></script>
<!-- after (knocked out javascript) -->
<script type="text/plain" data-sid="extservice" src="https://ext-service.net/js/install_many_cookies.js" ></script>
`````

To prevent an iFrame from installing cookies you must manipulate the ```src``` attribute and preventing the iframe from loading the external page. We can write the content of the src attribute to another attribute e.g. ```data-src```.

`````html
<!-- before -->
<iframe src="https://www.youtube.com/embed/XGT82nnmF4c" width="560" height="315"></iframe>
<!-- after (knocked out iframe) -->
<iframe src="" data-sid="youtube" data-src="https://www.youtube.com/embed/XGT82nnmF4c" width="560" height="315"></iframe>
`````

The Drupal hook system offers extensive options for manipulating source code, libraries, header tags, etc. Actually, it's always the same 3-5 hooks that you need to get to your goal.

#### For Javascript:
```php
hook_library_info_alter();
hook_page_attachments();
hook_js_alter();
```

#### For iframes (if they are based on a field)
```php
hook_preprocess_field();
```

### Re-animate the third-party integration
These knock-outs are re-animated in the frontend using Javascript. As soon as the user saves his consent in the COOKiES-UI (and every time a page is loaded) a Javascript event "cookiesjsrUserConsent" is fired, in which the decisions of the user are communicated.

#### Re-animate a ```<script/>```
The re-animation takes place in such a way that an event listener for the event "cookiesjsrUserConsent" must be set up, and depending on how the user has decided regarding my service, the Javascript or the iframe is re-animated.

````js
document.addEventListener('cookiesjsrUserConsent', function (event) {
  var service = (typeof event.detail.services === 'object') ? event.detail.services : {};
  if (typeof service['cookies_demo'] !== 'undefined' && service['cookies_demo']) {
    // Manipulate DOM to reanimate your third-party integration.
  }
});
````

For the Javascript, which we paralyzed with the type attribute, it is not enough to simply remove the attribute again or to correct its content. We still have to make sure it actually runs. We do this by cloning the script tag, then removing the type attribute, and replacing the old tag with the new one. Then the Javascript is executed immediately.

````js
jQuery('script[data-sid="extservice"]').each(function() {
    var replacement = jQuery(this).clone().removeAttr('type');
    jQuery(this).replaceWith(replacement.html());
});
````

#### Re-animate a ```<iframe/>```
We have it easier with the iframe. Here we only need to read the content of the data-src attribute and write it back into the src attribute. - 

```js
jQuery('iframe[data-sid="youtube"]').each(function() {
    jQuery(this).attr('src', jQuery(this).data('src'));
});
```

However, there is another problem with the iframe. An empty iframe leaves a big gap in the layout. It would be nice if this gap were used to display a text in it that the iframe is deactivated because the user has not yet given his consent. It would be even better if there was a button to get approval with one click and thus activate the iframe immediately. For this function, the COOKiES module comes with a jQuery extension that makes it possible.

A complete script to re-animate an iframe will look like this.

```js
document.addEventListener('cookiesjsrUserConsent', function (event) {
    var service = (typeof event.detail.services === 'object') ? event.detail.services : {};
    if (typeof service['youtube'] !== 'undefined' && service['youtube']) {
        jQuery('iframe[data-sid="youtube"]').each(function() {
            jQuery(this).attr('src', jQuery(this).data('src'));
        });
    } else {
        $('iframe[data-sid="youtube"]', context).cookiesOverlay('video');
    }
});
```

## Some pitfalls and trip hazards:
* In the production environment javascript is usually compressed and aggregated. Our javascripts, which we want to deactivate, are no longer displayed in their own script tag in the source code. To prevent this, the attribute ```preprocess: false``` must be set  for the corresponding file in the library.
* The cookies module does not (yet) have its own cache context. In principle, it would also be possible to evaluate user decisions in the backend, and avoid to knock-out scripts or iframes, since the cookie (in which the user decisions are stored) can also be accessed from backend. However, it is important to pay attention to the cache, which is usually deactivated in the dev environment. On the production environment suddenly nothing works because the cache has been activated.