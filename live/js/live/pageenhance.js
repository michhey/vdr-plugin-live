/*
 * This is part of the live vdr plugin. See COPYING for license information.
 *
 * PageEnhance class.
 *
 * This class applies several functions to the page based on
 * selectors. This class is quite project dependent and not a general
 * purpose class.
 */

var PageEnhance = new Class({
	  options: {
		  epgLinkSelector: 'a[href^="epginfo.html?epgid"]',
		  actionLinkSelector: 'a[href^="vdr_request/"]',
		  hintTipSelector: '*[title]',
		  hintClassName: 'hint',
		  notifyIdPrefix: 'notify',
		  infoWinStrings: {
			  loadingMsg: 'loading',
			  errorMsg: 'an error occured!'
			},
		  notifyStrings: {
			  successMsg: '<img src="active.png" alt=""> Success!',
			  errorMsg: '<img src="del.png" alt=""> failed!'
		  },
		  datePickerSelector: 'input.DatePicker',
		  datePickerOptions: ''
	  },

	  initialize: function(options){
			this.setOptions(options);
			this.$notifyCount = 0;
			window.addEvent('domready', this.domReadySetup.bind(this));
			window.addEvent('mousedown', this.mouseDownSetup.bind(this));
		},

	  // actions applied on domready to the page.
	  domReadySetup: function(){
			$$(this.options.epgLinkSelector).each(this.epgPopup.bind(this));
			this.addHintTips($$(this.options.hintTipSelector));
			$$(this.options.actionLinkSelector).each(this.vdrRequest.bind(this));
			$$(this.options.datePickerSelector).each(this.datePicker.bind(this));
		},

	  // actions applied on mouse down.
	  mouseDownSetup: function(){
			$$('.' + this.options.hintClassName + '-tip').setStyle('visibility', 'hidden');
		},

	  // registered as 'onDomExtend' event for InfoWin. Takes care to
	  // enhance the new dom elements too.
	  domExtend: function(id, elems){
			var sel = '#' + id + ' ' + this.options.hintTipSelector;
			elems = $$(sel);
			this.addHintTips(elems);
			$$('#' + id + ' ' + this.options.actionLinkSelector).each(this.vdrRequest.bind(this));
		},

	  // Epg Popup function. Apply to all elements that should
	  // pop up an Epg InfoWin window.
	  epgPopup: function(el){
			var href = el.href;
			var epgid = $pick(href, "");
			if (epgid != "") {
				var extractId = /epgid=(\w+)/;
				var found = extractId.exec(epgid);
				if ($defined(found) && found.length > 1) {
					epgid = found[1];
					el.addEvent('click', function(event){
							var event = new Event(event);
							new InfoWin.Ajax(epgid, href, {
								  bodyselect: 'div.epg_content',
								  onDomExtend: this.domExtend.bind(this),
								  loadingMsg: this.options.infoWinStrings.loadingMsg,
								  errorMsg: this.options.infoWinStrings.errorMsg
								}).show(event);
							event.stop();
							return false;
						}.bind(this));
				}
			}
		},

	  // function that requests an action from the server vdr.
	  vdrRequest: function(el){
			el.addEvent('click', function(event, element){
					var href = $pick(element.href, "");
					if (href != "") {
						this.$notifyCount++;
						var req = new Ajax(href, {
							  method: 'post',
							  onComplete: function(text, xmldoc) {
									try {
										var success = xmldoc.getElementsByTagName('response').item(0).firstChild.nodeValue;
										new InfoWin.Notifier(this.options.notifyIdPrefix + this.$notifyCount, {
											  className: success == '1' ? 'ok' : 'err',
											  message: success == '1' ? this.options.notifyStrings.successMsg : this.options.notifyStrings.errorMsg
											}).show(event);
									} catch(e) {
									}
								}.bind(this)
							});
						req.request('async=1');
						event.stop();
						return false;
					}
					return true;
				}.bindWithEvent(this, el));
		},

	  // change normal 'title'-Attributes into enhanced hinttips
	  // usesd by domExtend and domReadySetup functions.
	  addHintTips: function(elems){
			if (!$defined(this.tips)) {
				this.tips = new HintTips(elems, {
					  maxTitleChars: 100,
					  className: this.options.hintClassName
					});
			}
			else {
				$$(elems).each(this.tips.build, this.tips);
			}
		},

	  // add datepicker to input element
	  datePicker: function(el){
			el.alt = this.options.datePickerOptions;
			new DatePicker(el);
		}

	});

PageEnhance.implement(new Events, new Options);