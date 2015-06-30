/**
 * Created by patrick on 18/01/15.
 */
$(function () {

    var gipyhButton = new GiphyButton("giphyButton", "message", "giphyModal");

    var window_focus = true;

    $(window).focus(function() {
        if(!window_focus) {
            clearFavCounter();
        }
        window_focus = true;
    }).blur(function() {
        window_focus = false;
    });

    /* Get browser */
    $.browser = {};
    $.browser.firefox = /firefox/.test(navigator.userAgent.toLowerCase());


    if (typeof String.prototype.endsWith !== 'function') {
        String.prototype.endsWith = function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }
    var youtubeRegex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    if (typeof String.prototype.isYoutubeUrl != 'function') {
        String.prototype.isYoutubeUrl = function () {
            var match = this.match(youtubeRegex);
            return !!(match && match[7].length == 11);
        }
    }

    if (typeof String.prototype.getYoutubeVideoId != 'function') {
        String.prototype.getYoutubeVideoId = function () {
            var match = this.match(youtubeRegex);
            if (match && match[7].length == 11) {
                return match[7];
            }
            return null;
        }
    }
    var spotifyTrackRegex = /^https?:\/\/open\.spotify\.com\/(album|track|user\/[^/]+\/playlist)\/([a-zA-Z0-9]+)$/;
    if (typeof String.prototype.isSpotifyUrl != 'function') {
        String.prototype.isSpotifyUrl = function () {
            var match = this.match(spotifyTrackRegex);
            return !!(match && match[1] && match[2]);
        }
    }

    if (typeof String.prototype.getSpotifyEmbedUrl != 'function') {
        String.prototype.getSpotifyEmbedUrl = function () {
            var match = this.match(spotifyTrackRegex);
            if (match && match[1] && match[2]) {
                return 'spotify:' + match[1].replace(/\//g, ':') + ':' + match[2];
            }
            return null;
        }
    }

    var giphyRegex = /^https?:\/\/giphy\.com\/gifs\/.*?-?([a-zA-Z0-9]+)$/;
    if (typeof String.prototype.isGiphyUrl != 'function') {
        String.prototype.isGiphyUrl = function () {
            var match = this.match(giphyRegex);
            return !!(match && match[1]);
        }
    }

    if (typeof String.prototype.getGiphyUrl != 'function') {
        String.prototype.getGiphyUrl = function () {
            var match = this.match(giphyRegex);
            if (match && match[1]) {
                return match[1];
            }
            return null;
        }
    }

    //if("Notification" in window){
    //    if (Notification.permission !== 'denied') {
    //        Notification.requestPermission(function (permission) {
    //            if (permission === "granted") {
    //                var notification = new Notification("New message", {body: "test", icon:"/favicon.ico"});
    //            }
    //        });
    //    }
    //}


    moment.locale(window.navigator.languages ? window.navigator.languages[0] : window.navigator.language);

    var unreadMessages = 0;

    var emots = {};
    $.getJSON("/images/emoticons/emoticons.json", function (data) {
        $.each(data.Emoticons, function (gif, info) {
            emots[gif] = {title: info.Name, codes: info.Equivalents}
        });
        $.emoticons.define(emots);
    });

    var chat = io('///chat');
    chat.on('message', function (data) {
        parseAndShowMessage(data);
    });

    chat.on('welcome', function (data) {

        var cr = $('<div/>').addClass('chat-row').append($('<div/>').addClass('chat-user')).append($('<div/>').addClass('chat-messages').addClass('clearfix').addClass('welcome').append($('<span/>'))).append($('<div/>').addClass('chat-extras'));
        $('.chat-scroll').append(cr);

        $('.chat-messages', cr).html("<b>Willkommen im Chat!</b>");
        if (data.users.length > 0) {
            $('.chat-messages', cr).append($('<div/>').text("Folgende User sind im Raum:"));
            data.users.forEach(function (user) {

                $('.chat-messages', cr).append($('<div/>').addClass('userlist').append($('<img/>').attr('src', user.image).addClass('profile')).append($('<div/>').text(user.name)));
            });

        } else {
            $('.chat-messages', cr).append($('<div/>').text("Du befindest dich gerade alleine im Raum!"));
        }

    });

    chat.on('userInChat', function(data){
        var cr = $('<div/>').addClass('chat-row').append($('<div/>').addClass('chat-user')).append($('<div/>').addClass('chat-messages').append($('<span/>'))).append($('<div/>').addClass('chat-extras'));
        $('.chat-scroll').append(cr);

        $('.chat-messages span', cr).append($('<div/>').text("Folgende User sind im Raum:"));
        data.users.forEach(function (user) {
            $('.chat-messages span', cr).append($('<div/>').addClass('userlist').append($('<img/>').attr('src', user.image).addClass('profile')).append($('<div/>').text(user.name)));
        });
    });

    var inputMessage = $('input.message');
    inputMessage.focus();

    $('form').on('submit', function (e) {
        e.preventDefault();

        var message = inputMessage.val();
        if (message.indexOf('/') === 0) {

            var cr = $('<div/>').addClass('chat-row').append($('<div/>').addClass('chat-user')).append($('<div/>').addClass('chat-messages').append($('<span/>'))).append($('<div/>').addClass('chat-extras'));
            $('.chat-scroll').append(cr);

            if (message === '/help' || message === '/h') {
                var help = '<b>Hilfe:</b><table class="help"><tr><th>Befehl</th><th>Beschreibung</th></tr>';

                help += '<tr><td>/autoscroll</td><td>&Auml;ndert das Autoscroll verhalten. Aktuell ist Autoscroll <b>'+($.localStorage.get('doNotScroll') === true ? 'deaktiviert' : 'aktiviert')+'</b>.</td></tr>';
                help += '<tr><td>/emots /emoticons</td><td>Auflistung aller Emoticons</td></tr>';
                help += '<tr><td>/w</td><td>Aktuelle User im Chat</td></tr>';

                help += '</table>';

                $('.chat-messages span', cr).html(help);
            } else if (message === '/emots' || message === '/emoticons') {
                var help = '<b>Emoticons:</b><table class="help"><tr><th>Name</th><th>Emoticion</th><th>Code</th></tr>';
                help += $.emoticons.toString(function (name, code, title) {
                    return '<tr><td>'+title+'</td><td><img src="/images/emoticons/'+name+'"></td><td>'+code+'</td></tr>';
                });
                help += '</table>';

                $('.chat-messages span', cr).html(help);
            } else if (message === "/autoscroll") {
                $.localStorage.set('doNotScroll', !$.localStorage.get('doNotScroll'));
                $('.chat-messages span', cr).html('<b>Autoscroll</b> ist nun <b>' + ($.localStorage.get('doNotScroll') === true ? 'deaktiviert' : 'aktiviert') + '</b>');
            } else if (message === '/w') {
                chat.emit('getChatUser');
                cr.remove();
            } else {
                $('.chat-messages span', cr).html('<b>' + message + '</b> ist kein gültiger Befehl. Für Hilfe <b>/help</b> eingeben.');
            }

            var bd = $('body,html');
            bd.scrollTop(bd[0].scrollHeight);

        } else {
            chat.emit('send-message', {message: message});
        }

        inputMessage.val('');
        inputMessage.focus();
    });

    function parseAndShowMessage(data) {
        var cr = $('<div/>').addClass('chat-row').append($('<div/>').addClass('chat-user')).append($('<div/>').addClass('chat-messages').append($('<span/>'))).append($('<div/>').addClass('chat-extras').append($('<button/>').append($('<span/>').html('&times;')).addClass('close').hide().click(function (e){
           cr.hide('fast', function(){cr.remove()});
        }), $('<div/>').addClass('time').attr('title', moment().calendar()).attr('data-time', moment().format()).text(moment().fromNow())));
        cr.hover(function(){
            cr.find('.close').show('fast');
        }, function(){
            cr.find('.close').hide('fast');
        });
        $('.chat-scroll').append(cr);

        var message = data.message;
        $('.chat-messages span', cr).text(message);
        message = $('.chat-messages span', cr).text();


        $('<img/>').attr('src', data.user.image).addClass('profile').appendTo($('.chat-user', cr));
        $('<div/>').text(data.user.name).appendTo($('.chat-user', cr));

        if(!window_focus){
            unreadMessages++;
            showFavCounter(unreadMessages);
        }

        message = message.replace(/</g, '&lt;');

        var res = message.match(/spotify:(album|track|user:[^/]+:playlist):[a-zA-Z0-9]+/g);

        if (res) {
            $.unique(res);
            res.forEach(function (uri) {
                    $('.chat-extras', cr).append(
                            $('<iframe>')
                                .attr('src', 'https://embed.spotify.com/?uri=' + uri)
                            .attr('width', 300).attr('height', uri.indexOf(':track:') !== -1 ? 80 : 380).attr('frameborder', 0).attr('allowtransparency', true)).append('<br/>');
                });
        }


        res = message.match(/(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?/ig);

        if (res) {
            $.unique(res);
            res.forEach(function (url) {
                message = message.replace(url, '<a href="' + url + '" target="_blank">' + url + '</a>');
                if(url.indexOf('.gif') !== -1 || url.indexOf('.jpg') !== -1  || url.indexOf('.png') !== -1 ) {
                    $('.chat-extras', cr).append(
                        $('<img>').attr('src', url)
                    );
                }

                if(url.isYoutubeUrl()) {
                    $('.chat-extras', cr).append(
                        $('<iframe>')
                            .attr('src', '//www.youtube.com/embed/' + url.getYoutubeVideoId() + '?rel=0' )
                            .attr('width', 300).attr('height', 169).attr('frameborder', 0).attr('allowfullscreen', true)).append('<br/>');
                }

                if(url.isSpotifyUrl()) {
                    var uri = url.getSpotifyEmbedUrl();
                    $('.chat-extras', cr).append(
                        $('<iframe>')
                            .attr('src', 'https://embed.spotify.com/?uri=' + uri)
                            .attr('width', 300).attr('height', uri.indexOf(':track:') !== -1 ? 80 : 380).attr('frameborder', 0).attr('allowtransparency', true)).append('<br/>');
               }

                if(url.isGiphyUrl()) {
                    var uri = url.getGiphyUrl();
                    $('.chat-extras', cr).append(
                        $('<img>').attr('src', 'http://media.giphy.com/media/' + uri + '/giphy.gif')
                    );
                }

            });


        }


        var msgs = message.split(/[<]/g);

        message = '';
        $.each(msgs, function(idx, msg) {
            if(idx > 0) {
                message += '<';
            }
            if(msg.indexOf('a href') !== 0) {

                var submsg = msg.split(/[ ]/g);
                $.each(submsg, function(sidx,smsg){
                    if(sidx > 0) {
                        message += ' ';
                    }
                    if (smsg.indexOf('spotify:')!== 0) {

                        message += $.emoticons.replace(smsg, function (name, code) {
                            return $('<img/>').attr('src', '/images/emoticons/' + name).attr('title', code)[0].outerHTML;
                        });
                    } else {
                        message += smsg
                    }
                });

            } else  {
                message += msg
            }

        });

        $('.chat-messages', cr).html(message);

        if (!$.localStorage.get('doNotScroll')) {
            var bd = $('body,html');
            bd.scrollTop(bd[0].scrollHeight);
        }

    }

    setInterval(function () {
        $('.chat-extras .time').each(function (idx, elm) {
            if ($(elm).attr('data-time')) {
                $(elm).text(moment($(elm).attr('data-time')).fromNow());
            }
        });
    }, 10000);

    function clearFavCounter(){
        unreadMessages = 0;
        showFavCounter(unreadMessages);
    }

    function showFavCounter(count) {
        var canvas = document.createElement('canvas'),
            ctx,
            img = document.createElement('img');
        var link = $.browser.firefox ? document.getElementById('favicon').cloneNode(true) : document.getElementById('favicon');

        if (canvas.getContext) {

            canvas.height = canvas.width = 16; // set the size
            ctx = canvas.getContext('2d');
            img.onload = function () { // once the image has loaded
                ctx.drawImage(img, 0, 0);
                if (count > 0) {
                    ctx.fillStyle = "#f00";
                    ctx.fillRect(9, 7, 9, 9);
                    ctx.fillStyle = '#FFFFFF';
                    if (count > 9) {
                        ctx.font = 'bold 10px "helvetica", sans-serif';
                        ctx.fillText('..', 10, 15);
                    } else {
                        ctx.font = 'bold 11px "helvetica", sans-serif';
                        ctx.fillText(count, 10, 15);
                    }
                }

                link.href = canvas.toDataURL('image/x-icon');
                if($.browser.firefox) {
                    document.body.appendChild(link);
                }
            };
            img.src = 'favicon.ico';
        }
    }
});
