// $(document).on("click", "#contactus", function() {
// 	var message = {
// 		"key" : "gT3fP43nVGIqv-DA0GwJHQ",
// 		"message" : {
// 		    "html": $("textarea[name=comment]").val(),
// 		    "subject": "Comments on TinyBucket",
// 		    "from_email": $("input[name=email]").val(),
// 		    "from_name": $("input[name=firstname]").val() + " " + $("input[name=lastname]").val(),
// 		    "to": [{
// 		            "email": "ikitha@hotmail.com",
// 		            "name": "TinyBucket",
// 		            "type": "to"
// 		        }],
// 		    "headers": {
// 		        "Reply-To": $("input[name=email]").val()
// 		    }
// 		}
// 	};

// 	$.ajax({
// 		url: "https://mandrillapp.com/api/1.0/messages/send.json",
// 		type: "POST",
// 		data: message,
// 		success: function(data) {
// 			window.location.href = "/discover";
// 		}
// 	})
// })