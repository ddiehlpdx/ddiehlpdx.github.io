﻿function scrollToHome() {
	var scrollTo = document.getElementById('home');
	scrollTo.scrollIntoView({block: 'start', behavior: 'smooth'});
}

function scrollToSkills() {
	var scrollTo = document.getElementById('skills');
	scrollTo.scrollIntoView({block: 'start', behavior: 'smooth'});
}

function scrollToPortfolio() {
	var scrollTo = document.getElementById('portfolio');
	scrollTo.scrollIntoView({block: 'start', behavior: 'smooth'});
}

function scrollToBio() {
	var scrollTo = document.getElementById('bio');
	scrollTo.scrollIntoView({block: 'start', behavior: 'smooth'});
}

(function ($) {
    $(document).ready(function () {

        //HIDE NAVBAR AT PAGE LOAD
        $('.navbar').hide();

        //FADE NAVBAR IN ON SCROLL
        $(function () {
            $(window).scroll(function () {

                //SCROLL DISTANCE TO FADE IN
                if ($(this).scrollTop() > 400) {
                    $('.navbar').fadeIn();
                } else {
                    $('.navbar').fadeOut();
                }
            });
        });

    });
}(jQuery));

(function ($) {
	$(document).ready(function () {
		
		//HIDE HEADINGS AT PAGE LOAD
		$('#fade1').hide();
		$('#fade2').hide();
		$('#fade3').hide();
		$('#fade4').hide();
		$('#fade5').hide();
		$('#circle1').hide();
		$('#circle2').hide();
		$('#circle3').hide();
		$('#btn1').hide();
		$('#btn2').hide();
		$('#btn3').hide();
		//FADE IN ONE BY ONE
		$('#fade1').fadeIn(1000);
		$('#fade2').fadeIn(2500);
		$('#fade3').fadeIn(4000);
		$('#fade4').fadeIn(4500);
		$('#fade5').fadeIn(4500);
		$('#circle1').fadeIn(250);
		$('#circle2').fadeIn(500);
		$('#circle3').fadeIn(750);
		$('#btn3').fadeIn(1000);
		$('#btn2').fadeIn(2500);
		$('#btn1').fadeIn(4000);
	});
}(jQuery));

(function($) {
  $.fn.visible = function(partial) {
    
      var $t            = $(this),
          $w            = $(window),
          viewTop       = $w.scrollTop(),
          viewBottom    = viewTop + $w.height(),
          _top          = $t.offset().top,
          _bottom       = _top + $t.height(),
          compareTop    = partial === true ? _bottom : _top,
          compareBottom = partial === true ? _top : _bottom;
    
    return ((compareBottom <= viewBottom) && (compareTop >= viewTop));

  };
    
})(jQuery);

var win = $(window);

var allMods = $('.module');

allMods.each(function(i, el) {
  var el = $(el);
  if (el.visible(true)) {
    el.addClass('already-visible'); 
  } 
});

win.scroll(function(event) {
  
  allMods.each(function(i, el) {
    var el = $(el);
    if (el.visible(true)) {
      el.addClass('come-in'); 
    } 
    else {
      el.removeClass('come-in already-visible');
    }
  });
  
});