(function ($) {

	"use strict";

	var fullHeight = function () {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function () {
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
		$('#sidebar').toggleClass('active');
	});

})(jQuery);


// -------------------------Start Dynamic Chat ------------------


function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}






const userData = JSON.parse(getCookie("user"));  //Get User getCookie('user')


var sender_id = userData._id;
var receiver_id;
var global_group_id;
const socket = io('/user', {
	auth: {
		token: sender_id
	}
});
$(document).ready(function () {
	$('.user-list').click(function () {

		var userId = $(this).attr('data-id');
		receiver_id = userId;
		$('.start-head').hide();
		$('.chat-section').show();

		socket.emit('existsChat', { sender_id: sender_id, receiver_id: receiver_id })
	});
});
// Get user online status
socket.on('getOnlineUser', function (data) {
	$('#' + data.user_id + '-status').text('Online')
	$('#' + data.user_id + '-status').removeClass('offline-status')
	$('#' + data.user_id + '-status').addClass('online-status')
});
// Get user Offline status
socket.on('getOfflineUser', function (data) {
	console.log(data);
	$('#' + data.user_id + '-status').text('Offline')
	$('#' + data.user_id + '-status').removeClass('online-status')
	$('#' + data.user_id + '-status').addClass('offline-status')
});
// Chat Save
$('#chat-form').submit(function (event) {
	event.preventDefault();
	var message = $('#message').val();
	$.ajax({
		url: '/save-chat',
		type: 'post',
		data: { sender_id: sender_id, receiver_id: receiver_id, message: message },
		success: function (response) {
			if (response.success) {
				console.log(response);
				$('#message').val('');
				let chat = response.data.message;
				let html = `<div class="current-user-chat" id='` + response.data._id + `'>
				<h5> <span>`+ chat + `</span>
					<i class="fa fa-trash" aria-hidden="true" data-id='` + response.data._id + `' data-toggle="modal" data-target="#deleteChatModel"></i>
					<i class="fa fa-edit" aria-hidden="true" data-id='` + response.data._id + `' data-msg='` + chat + `' data-toggle="modal" data-target="#editChatModel"></i>
					</h5>
				</div>`
					;
				$('#chat-container').append(html);
				socket.emit('newChat', response.data);

				scrolleChat();

			} else {
				alert(response.msg);
			}
		}
	});
});


socket.on('loadNewChat', function (data) {
	if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
		let html = `
		<div class="distance-user-chat" id='`+ data._id + `'>
					<h5><span>`+ data.message + `</span>
						</h5>
				</div>
		`;
		$('#chat-container').append(html);

	}
	scrolleChat();
});
//showOldMessage
socket.on('showOldMessage', function (data) {
	$('#chat-container').html('');
	var chats = data.chats;
	var html = '';
	for (let x = 0; x < chats.length; x++) {
		let addClass = '';
		if (chats[x]['sender_id'] == sender_id) {
			addClass = 'current-user-chat'
		} else {
			addClass = 'distance-user-chat'
		}
		html += `<div class='` + addClass + `' id='` + chats[x]['_id'] + `'>
					<h5><span>`+ chats[x]['message'] + `</span>`;
		if (chats[x]['sender_id'] == sender_id) {
			html += `<i class="fa fa-trash" aria-hidden="true" data-id='` + chats[x]['_id'] + `' data-toggle="modal" data-target="#deleteChatModel"></i>
			<i class="fa fa-edit" aria-hidden="true" data-id='` + chats[x]['_id'] + `' data-msg='` + chats[x]['message'] + `' data-toggle="modal" data-target="#editChatModel"></i>
			`;
		}
		html += ` </h5 > </div >`;
	}
	$('#chat-container').append(html);

	scrolleChat();

});

function scrolleChat() {
	$('#chat-container').animate({
		scrollTop: $('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
	}, 0);
}

//Delet A single  Chat 

$(document).on('click', '.fa-trash', function () {
	let msg = $(this).parent().text()
	$('#delete_message').text(msg);
	$('#delete-message-id').val($(this).attr('data-id'));
});
$('#delete-chat-form').submit(function (event) {
	event.preventDefault();
	var id = $('#delete-message-id').val();
	$.ajax({
		url: '/delete-chat',
		type: 'post',
		data: { id: id },
		success: function (res) {
			if (res.success == true) {
				$('#' + id).remove();
				$('#deleteChatModel').modal('hide');
				socket.emit('chatDeleted', id);
			} else {
				alert(res.msg)
			}
		}
	})
});

socket.on('chatMassageDeleted', function (id) {
	$('#' + id).remove();
});


//Update user Chat
$(document).on('click', '.fa-edit', function () {
	$('#edit-message-id').val($(this).attr("data-id"));
	$('#update-message').val($(this).attr("data-msg"));
});

$('#update-chat-form').submit(function (event) {
	event.preventDefault();
	var id = $('#edit-message-id').val();
	var msg = $('#update-message').val();
	$.ajax({
		url: '/update-chat',
		type: 'post',
		data: { id: id, message: msg },
		success: function (res) {
			if (res.success == true) {
				$('#editChatModel').modal('hide');
				$("#" + id).find('span').text(msg);
				$("#" + id).find('.fa-edit').attr("data-msg", msg);
				socket.emit('chatUpdated', { id: id, message: msg });
			} else {
				alert(res.msg)
			}
		}
	})
});

socket.on('chatMassageUpdated', function (data) {
	$("#" + data.id).find('span').text(data.message);
});


//add member js
$('.addMember').click(function () {
	var id = $(this).attr('data-id');
	var limit = $(this).attr('data-limit');


	$('#group_id').val(id);
	$('#limit').val(limit);

	$.ajax({
		url: '/get-member',
		type: 'post',
		data: { group_id: id },
		success: function (response) {
			// console.log(response);
			if (response.success == true) {
				let users = response.data;

				let html = '';

				for (let i = 0; i < users.length; i++) {
					let isMemberOfGroup = users[i]['member'].length > 0 ? true : false;

					html += `
					<tr>
					  <td>
						<input type="checkbox" `+ (isMemberOfGroup ? 'checked' : '') + ` name= "members[]" value="` + users[i]['_id'] + `"/>
					   </td>
					 <td>`+ users[i]['name'] + `</td>
				    </tr>
					`;
				}
				// console.log(html);
				$('.addMemberInTable').html(html);
			} else {
				alert(response.msg)
			}
		}
	})
});


//Add Member Form submit
$('#add-member-form').submit(function (event) {
	event.preventDefault();
	var formData = $(this).serialize();
	$.ajax({
		url: '/add-member',
		type: 'post',
		data: formData,
		success: function (response) {
			if (response.success == true) {
				alert(response.msg);
				$('#memberModel').modal('hide')
				$('#add-member-form')[0].reset();
			} else {
				$('#add-member-error').text(response.msg);
				setTimeout(() => {
					$('#add-member-error').text('');
				}, 3000);
			}

		}
	})
})
//Update Group 

$('.updateMember').click(function () {
	var obj = JSON.parse($(this).attr('data-obj'));
	$(`#update_group_id`).val(obj._id);
	$(`#last_limit`).val(obj.limit);
	$(`#group_name`).val(obj.name);
	$(`#group_limit`).val(obj.limit);
	// $(`#group_id`).val(obj._id);
});

$('#updateChatGroupForm').submit(function (e) {
	e.preventDefault();
	$.ajax({
		url: "/update-chat-groups",
		type: "POST",
		data: new FormData(this),
		contentType: false,
		cache: false,
		processData: false,
		success: function (res) {
			alert(res.msg);
			if (res.success) {
				location.reload()
			}
		}
	})
});

//Delete Chat Group

$('.deleteGroup').click(function () {

	$('#deleteGroup_id').val($(this).attr('data-id'))
	$('#deleteGroupName').text($(this).attr('data-name'));

});

$('#deleteChatGroupForm').submit(function (e) {
	e.preventDefault();
	var formData = $(this).serialize();
	$.ajax({
		url: '/delete-chat-groups',
		type: 'POST',
		data: formData,
		success: function (res) {
			alert(res.msg);
			if (!res.success) {
				location.reload()
			}
		}
	})
});

// Copy Sharable link

$('.copy').click(function () {
	$(this).prepend('<span class="copied_text">Copied!</span>');
	var group_id = $(this).attr("data-id");
	console.log(group_id);
	var url = window.location.host + '/share-group/' + group_id;
	var temp = $('<input>');
	$('body').append(temp);
	temp.val(url).select();
	document.execCommand("copy");
	temp.remove();
	setTimeout(() => {
		$(".copied_text").remove();
	}, 2000);
});

//Join a group 

$('.join-now').click(function () {
	$(this).text('Joining...');
	$(this).attr('disabled', 'disabled');

	var group_id = $(this).attr('data-id')
	$.ajax({
		url: '/join-group',
		type: 'POST',
		data: { group_id: group_id },
		success: function (response) {
			alert(response.msg);
			if (response.success) {
				location.reload();
			} else {

				$(this).text('Join Now');
				$(this).removeAttr('disabled')
			}
		}
	})
})

/*----------Group Chating  -------------*/

function groupScrolleChat() {
	$('#group-chat-container').animate({
		scrollTop: $('#group-chat-container').offset().top + $('#group-chat-container')[0].scrollHeight
	}, 0);
}

$('.group-list').click(function () {
	$('.group-start-head').hide();
	$('.group-chat-section').show();
	global_group_id = $(this).attr('data-id');
	loadGroupChat()

});

$('#group-chat-form').submit(function (event) {
	event.preventDefault();

	var message = $('#group-message').val();

	$.ajax({
		url: '/group-chat-save',
		type: 'post',
		data: { sender_id: sender_id, group_id: global_group_id, message: message },
		success: function (response) {
			if (response.success) {
				$('#group-message').val('');
				let message = response.chat.message;
				let html = `<div class="current-user-chat" id='` + response.chat._id + `'>
				<h5> 
				<span>`+ message + `</span>
				<i class="fa fa-trash deleteGroupChat" aria-hidden="true" data-id='` + response.chat._id + `' data-toggle="modal" data-target="#deleteGroupChatModel"></i>
				<i class="fa fa-edit editGroupChat" aria-hidden="true" data-id='` + response.chat._id + `' data-msg='` + message + `' data-toggle="modal" data-target="#editChatModel"></i>	
				</h5>`
				var date = new Date(response.chat.createdAt);
				let cDate = date.getDate()
				let cMonth = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1);
				let cYear = date.getFullYear();
				let getFullYear = cDate + '-' + cMonth + '-' + cYear;


				html += `
				<div class="user-data"> <b>Me: </b>`+ getFullYear + ` </div>
				</div>`
					;
				$('#group-chat-container').append(html);
				socket.emit('newGroupChat', response.chat);
				groupScrolleChat()

			} else {
				alert(response.msg);
			}
		}
	});
});

socket.on('loadNewGroupChat', function (data) {

	if (global_group_id == data.group_id) {

		let html = `<div class="distance-user-chat" id='` + data._id + `'>
				<h5> 
				<span>`+ data.message + `</span>
					</h5>`;

		var date = new Date(data.createdAt);
		let cDate = date.getDate()
		let cMonth = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1);
		let cYear = date.getFullYear();
		let getFullYear = cDate + '-' + cMonth + '-' + cYear;
		
		html += `
		        <div class="user-data">
						<img src="`+ data.sender_id.image + `" class="user-chat-image"/>
						<b>`+ data.sender_id.name + `</b>` + getFullYear + `
				</div>
		</div>`
			;
		$('#group-chat-container').append(html);
		groupScrolleChat()
	}
});

function loadGroupChat() {
	$.ajax({
		url: '/load-group-chat',
		type: 'post',
		data: { group_id: global_group_id },
		success: function (res) {
			if (res.success) {
				let chats = res.chats;
				let html = '';
				for (let i = 0; i < chats.length; i++) {
					let className = 'distance-user-chat';
					if (chats[i]['sender_id']._id == sender_id) {
						className = 'current-user-chat';
					}
					html += `<div class='` + className + `' id='` + chats[i]['_id'] + `'>
					<h5> 
					<span>`+ chats[i]['message'] + `</span>`

					if (chats[i]['sender_id']._id == sender_id) {
						html += `<i class="fa fa-trash deleteGroupChat" aria-hidden="true" data-id='` + chats[i]['_id'] + `' data-toggle="modal" data-target="#deleteGroupChatModel"></i>
						<i class="fa fa-edit editGroupChat" aria-hidden="true" data-id='` + chats[i]['_id'] + `' data-msg='` + chats[i]['message'] + `' data-toggle="modal" data-target="#editGroupChatModel"></i>	`
					}
					html += `
						</h5>`;
					var date = new Date(chats[i]['createdAt']);
					let cDate = date.getDate()
					let cMonth = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1);
					let cYear = date.getFullYear();
					let getFullYear = cDate + '-' + cMonth + '-' + cYear;

					if (chats[i]['sender_id']._id == sender_id) {
						html += `
						<div class="user-data"> <b>Me: </b>`+ getFullYear + ` </div>
						`;
					} else {
						html += `
						<div class="user-data">
						<img src="`+ chats[i]['sender_id'].image + `" class="user-chat-image"/>
						<b>`+ chats[i]['sender_id'].name + `</b>` + getFullYear + `
						</div>
						`;
					}
					html += `
					</div>`
				}
				$("#group-chat-container").html(html);
				groupScrolleChat()
			} else {
				alert(res.msg);
			}
		}
	});
}

$(document).on('click', '.deleteGroupChat', function () {
	var msg = $(this).parent().find('span').text();
	$('#delete-group-message').text(msg);
	$('#delete-group-message-id').val(($(this).attr("data-id")));
})

$('#delete-group-chat-form').submit(function (e) {
	e.preventDefault();

	var id = $('#delete-group-message-id').val();
	$.ajax({
		url: '/delete-group-chat',
		type: "Post",
		data: { id: id },
		success: function (res) {
			if (res.success) {
				$('#' + id).remove();
				$('#deleteGroupChatModel').modal('hide');
				alert(res.msg);
				socket.emit('groupChatDeleted', id);
			} else {
				alert(res.msg)
			}
		}

	})

});

//listening chat id using  socket io
socket.on('groupChatMessageDeleted', function (id) {
	$('#' + id).remove();
});

// Edid Chat  Message Model Show And Hide
$(document).on('click', '.editGroupChat', function () {

	$('#edit-group-message-id').val($(this).attr("data-id"));
	$('#update-group-message').val($(this).attr("data-msg"));

})

$('#update-group-chat-form').submit(function (e) {
	e.preventDefault();

	var id = $('#edit-group-message-id').val();
	var msg = $('#update-group-message').val();

	$.ajax({
		url: '/update-group-chat',
		type: "Post",
		data: { id: id, message: msg },
		success: function (res) {
			if (res.success) {

				$('#editGroupChatModel').modal('hide');
				$('#' + id).find('span').text(msg);
				$('#' + id).find('.editGroupChat').attr('data-msg', msg);
				alert(res.msg);
				socket.emit('groupChatUpdated', { id: id, message: msg });
			} else {
				alert(res.msg)
			}
		}

	})
});

socket.on('groupChatMassageUpdated', function (data) {

	$('#' + data.id).find('span').text(data.message);

});