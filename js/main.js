jQuery(document).ready(function($){
	var gallery = $('.cd-gallery'),
		foldingPanel = $('.cd-folding-panel'),
		mainContent = $('.cd-main');
        pageContent = $('.cd-fold-content');
	/* open folding content */
	gallery.on('click', 'a', function(event){
		event.preventDefault();
		openItemInfo($(this).attr('href'));
        
	});

	/* close folding content */
	foldingPanel.on('click', '.cd-close', function(event){
		event.preventDefault();
		toggleContent('', false);
	});
	gallery.on('click', function(event){
		/* detect click on .cd-gallery::before when the .cd-folding-panel is open */
		if($(event.target).is('.cd-gallery') && $('.fold-is-open').length > 0 ) toggleContent('', false);
	})

	function openItemInfo(url) {
		var mq = viewportSize();
		if( gallery.offset().top > $(window).scrollTop() && mq != 'mobile') {
			/* if content is visible above the .cd-gallery - scroll before opening the folding panel */
			$('body,html').animate({
				'scrollTop': gallery.offset().top
			}, 100, function(){ 
	           	toggleContent(url, true);
	        }); 
	    } else if( gallery.offset().top + gallery.height() < $(window).scrollTop() + $(window).height()  && mq != 'mobile' ) {
			/* if content is visible below the .cd-gallery - scroll before opening the folding panel */
			$('body,html').animate({
				'scrollTop': gallery.offset().top + gallery.height() - $(window).height()
			}, 100, function(){ 
	           	toggleContent(url, true);
	        });
		} else {
			toggleContent(url, true);
		}
	}
    
    

	function toggleContent(url, bool) {
		if( bool ) {
			/* load and show new content */
			var foldingContent = foldingPanel.find('.cd-fold-content');
			foldingContent.load(url+' .cd-fold-content > *', function(event){
				setTimeout(function(){
					$('body').addClass('overflow-hidden');
					foldingPanel.addClass('is-open');
					mainContent.addClass('fold-is-open');
				}, 100);
				
			});
		} else {
			/* close the folding panel */
			var mq = viewportSize();
            pageContent.scrollTop(0);
			foldingPanel.removeClass('is-open');
			mainContent.removeClass('fold-is-open');
			
			(mq == 'mobile' || $('.no-csstransitions').length > 0 ) 
				/* according to the mq, immediately remove the .overflow-hidden or wait for the end of the animation */
				? $('body').removeClass('overflow-hidden')
				
				: mainContent.find('.cd-item').eq(0).one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
					$('body').removeClass('overflow-hidden');
					mainContent.find('.cd-item').eq(0).off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend');
				});
		}
		
	}

	function viewportSize() {
		/* retrieve the content value of .cd-main::before to check the actua mq */
		return window.getComputedStyle(document.querySelector('.cd-main'), '::before').getPropertyValue('content').replace(/"/g, "").replace(/'/g, "");
	}
    
    
    
    	//////////////////////////////////////////////////////////////////
	/// MENU BUTTON
	//////////////////////////////////////////////////////////////////
    
    
    
    
    
    
    	var taco = $(window).height()
	$('.hero').css('height', taco+'px')
	$('.about').css('height', taco+'px')
	$('.about-wrap').css('height', taco+'px')
	$('.head').css('height', taco+'px')
    
    

	var fullPath = window.location.pathname;
	
	if(fullPath == "/") { 
				$('.home').addClass('strike')


		$('.btn-about').on('click', function(e){
			e.preventDefault();
			$('.about').toggleClass('about-show')
			$('body').toggleClass('stop-scrolling')
			$('.btn-about').toggleClass('btn-about-show')
            $('.one-dot').toggleClass('white-dot')
            
		});

	
	} else {

		$('.btn-about').on('click', function(e){
			e.preventDefault();
			$('.about').toggleClass('about-show')
			$('body').toggleClass('stop-scrolling')
			$('.btn-about').toggleClass('btn-about-show')
            //$('nav').toggleClass('black-nav')
            $('.one-dot').toggleClass('white-dot')
            
		});

	}
    
    
    
    
    

});