var betafarm = window.betafarm || {};

betafarm.project_links = function() {
    var add, bin, init;
    add = function(el, csrf) {
        $('#addLinkErrorList').detach();
        var parent = el.parent(),
            grand_parent = parent.parent(),
            name = parent.find('input[name=link_name]'),
            name_val = name.val(),
            url = parent.find('input[name=link_url]'),
            url_val = url.val(),
            blog = parent.find('input[name=link_blog]'),
            blog_on = blog.prop('checked'),
            post_data = {
                'name': name_val,
                'url': url_val,
                'csrfmiddlewaretoken': csrf
            },
            message = false,
            loading;
        if (blog_on) {
            post_data.blog = 'on';
        }
        if (!message) {
            message = $('<div class="message">Adding link...</div>').prependTo(grand_parent);
        }
        loading = window.setTimeout(function() {
            loading = false;
            grand_parent.css('visibility','hidden');
            message.css('display','block');
            parent.css('display','none');
            grand_parent.css('visibility','visible');
        }, 500);
        $.ajax({
            type:'POST',
            url:el.attr('href'),
            data: post_data,
            success: function() {
                if (!loading) {
                    message.css('display','none');
                    parent.css('display','block');
                    grand_parent.css('visibility','visible');
                } else {
                    window.clearTimeout(loading);
                }
                $.ajax({
                    type:'GET',
                    url:parent.attr('data-list-links'),
                    success : function(data) {
                        $('ul.yourLinks').replaceWith(data);
                        name.val('');
                        url.val('');
                        blog.prop('checked', false);
                    }
                });
            },
            error: function(data) {
                if (!loading) {
                    message.css('display','none');
                    parent.css('display','block');
                    grand_parent.css('visibility','visible');
                } else {
                    window.clearTimeout(loading);
                }
                var response = $.parseJSON(data.responseText),
                    errors = [],
                    $errorList = $('<ul id="addLinkErrorList" class="errorlist"></ul>');
                if (response.hasOwnProperty('url')) {
                    errors.push({
                        'label': 'URL',
                        'msg': response.url,
                        'href': '#id_url'
                    });
                }
                if (response.hasOwnProperty('name')) {
                    errors.push({
                        'label': 'Title',
                        'msg': response.name,
                        'href': '#id_title'
                    });
                }
                $.each(errors, function(i, e) {
                    var $link = $('<a class="error"></a>').attr('href', e.href)
                        .append(e.label + ": " + e.msg.toString());
                    $errorList.append($('<li></li>').append($link));
                });
                $('div.addLink').before($errorList);
            }
        });
    };

    bin = function(el, csrf) {
         $.ajax({
            type:'POST',
            url: el.attr('href'),
            data: {
                'csrfmiddlewaretoken':csrf
            },
            success: function() {
                var parent = el.parent();
                parent.fadeOut('slow', function() {
                    parent.remove();
                });
            }
        });
    };

    init = function() {
         $('li.links').bind('click', function(event) {
            var that = $(event.target),
                csrf = that.closest('form').find('input[name=csrfmiddlewaretoken]');
            if (that.hasClass('delete')) {
                bin(that, csrf.val());
                return false;
            }
            if (that.hasClass('add')) {
                add(that, csrf.val());
                return false;
            }
            if (that.hasClass('error')) {
                var input_id = '#' + that.attr('href').split('#')[1];
                $(input_id).focus();
                return false;
            }
         });
    };

    return {
        'init': init
    };

}();

betafarm.streams = function() {
    var fetch, init,
        loader = false;
    fetch = function(el, bucket) {
        var ajax_url = el.attr('href'),
            max_entries = bucket.attr('data-total-entries'),
            loading;
        if (!loader) {
            loader = $('<div class="message"><b>Loading older entries</b></div>').insertBefore(el);
        }
        loading = window.setTimeout(function() {
            loading = false;
            loader.css('display','block');
            el.css('display','none');
        }, 500);
        $.ajax({
            type:'GET',
            url: ajax_url,
            success: function(data) {
                bucket.append(data);
                var current_total = bucket.find('li').length,
                    more = current_total < max_entries;
                if (more) {
                    var page = parseInt(ajax_url.replace(/[^\d]+/,''), 10),
                        new_url = ajax_url.replace(/[\d]+/, page + 1);
                        el.attr('href',new_url);
                } else {
                    el.remove();
                }
                if (!loading) {
                    loader.css('display', 'none');
                    el.css('display','block');
                } else {
                    window.clearTimeout(loading);
                }
            }
        });
    };

    init = function() {
        $('a.fetchActivity').bind('click', function() {
            var current = $(this),
                ajax_hole = $('ul.activityStream');
            fetch(current, ajax_hole);
            return false;
        });
    };

    return {
        'init': init
    };

}();

betafarm.filtering = function() {

    var init, filter, display,
        filtered = $('#projects-list'),
        holder = $('#projects-holder'),
        info = $('#meta'),
        loader = false;

    filter = function(topic, aside) {
        info.find('.current').removeClass('current');
        aside.addClass('current');
        filtered.isotope({
            filter: '.' + topic
        });
    };

    display = function(topic, data) {
        var topic_info = $('#' + topic),
            loading;
        if (topic_info.length) {
            filter(topic, topic_info);
        } else {
            if (!loader) {
                loader = $('<div class="message span2">Loading topic data</div>')
                    .appendTo(info);
            }
            loading = window.setTimeout(function() {
                loading = false;
                info.addClass('loading');
            }, 500);
            $.ajax({
                type: 'GET',
                url: data + 'about/',
                success: function(data) {
                    info.prepend(data);
                    filter(topic, $('#' + topic));
                    if (!loading) {
                        info.removeClass('loading');
                    } else {
                        window.clearTimeout(loading);
                    }
                }
            });
        }
    };

    init = function() {

        if ($('#all_projects').length) {
            var area = $('#main-content');

            filtered.isotope({
                itemSelector : '.project',
                layoutMode : 'fitRows'
            });

            area.bind('click', function(e) {
                var target = $(e.target);
                if (target.is('a.tag')) {
                    holder.addClass('shift');
                    var url = target.attr('href'),
                        chunks = target.attr('href').split('/');
                    display(chunks[chunks.length-2], url);

                    return false;
                }
                if (target.is('a.close')) {
                    holder.removeClass('shift');
                    filtered.isotope({ filter: '*' });
                    return false;
                }
            });
        }
    };

    return {
        'init': init
    };
}();

$(function($) {
    // sticky footer
    $(window).bind('load resize', function() {
        var h = $(window).height(),
            a = $('#site_meta').outerHeight();
        $('.wrapper:first').css({ 'min-height' : (h-a) });
        //$('#ohnoes').css({'height': (h-a-71) });
    });
    // browserid
    $('#browserid').bind('click', function(e) {
        e.preventDefault();
        navigator.id.getVerifiedEmail(function(assertion) {
            if (assertion) {
                $('#id_assertion').val(assertion.toString());
                $('#browserid_form').submit();
            }
        });
    });
    // notification bar
    $('#notification_close').bind('click', function(e) {
        e.preventDefault();
        $(this).parents('.notification').fadeOut();
    });
    betafarm.project_links.init();
    betafarm.streams.init();
    betafarm.filtering.init();
});
