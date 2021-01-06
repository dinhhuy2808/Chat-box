import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as firebase from 'firebase';
import { DatePipe } from '@angular/common';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const snapshotToArray = (snapshot: any) => {
	const returnArr = [];

	snapshot.forEach((childSnapshot: any) => {
		const item = childSnapshot.val();
		item.key = childSnapshot.key;
		returnArr.push(item);
	});

	return returnArr;
};

@Component({
	selector: 'app-roomlist',
	templateUrl: './roomlist.component.html',
	styleUrls: ['./roomlist.component.css']
})
export class RoomlistComponent implements OnInit {
	@ViewChild('chatcontent') chatcontent: ElementRef;
	scrolltop: number = null;

	nickname = '';
	displayedColumns: string[] = ['roomname'];
	rooms = [];
	isLoadingResults = true;
	chatMaps = new Map();
	messages: string[] = [];

	subscription: Subscription;
	statusText: string;
	polling: any;

	constructor(private route: ActivatedRoute, private router: Router, public datepipe: DatePipe) {
		this.nickname = localStorage.getItem('nickname');
		firebase.database().ref('rooms/').on('value', resp => {
			this.rooms = [];
			this.rooms = snapshotToArray(resp);
			this.rooms.forEach(room => {
				firebase.database().ref('chats/').orderByChild('roomname').equalTo(room.roomname).on('value', resp => {
					let chats: any = [];
					chats = snapshotToArray(resp);
					setTimeout(() => this.scrolltop = this.chatcontent.nativeElement.scrollHeight * 2, 500);
					this.chatMaps.set(room.roomname, chats);
				});
				this.messages.push('');
			});
			this.isLoadingResults = false;
		});
	}

	ngOnInit(): void {
		this.polling = setInterval(()=>
		{document.getElementsByClassName("chat-messages")[1].scrollTop=
		document.getElementsByClassName("chat-messages")[1].scrollHeight}, 500);

	}

	enterChatRoom(roomname: string) {
		const chat = { roomname: '', nickname: '', message: '', date: '', type: '' };
		chat.roomname = roomname;
		chat.nickname = this.nickname;
		chat.date = this.datepipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss');
		chat.message = `${this.nickname} enter the room`;
		chat.type = 'join';
		const newMessage = firebase.database().ref('chats/').push();
		newMessage.set(chat);

		firebase.database().ref('roomusers/').orderByChild('roomname').equalTo(roomname).on('value', (resp: any) => {
			let roomuser = [];
			roomuser = snapshotToArray(resp);
			const user = roomuser.find(x => x.nickname === this.nickname);
			if (user !== undefined) {
				const userRef = firebase.database().ref('roomusers/' + user.key);
				userRef.update({ status: 'online' });
			} else {
				const newroomuser = { roomname: '', nickname: '', status: '' };
				newroomuser.roomname = roomname;
				newroomuser.nickname = this.nickname;
				newroomuser.status = 'online';
				const newRoomUser = firebase.database().ref('roomusers/').push();
				newRoomUser.set(newroomuser);
			}
		});

		this.router.navigate(['/chatroom', roomname]);
	}

	logout(): void {
		localStorage.removeItem('nickname');
		this.router.navigate(['/login']);
	}


	send(index: number, roomname: string) {
		let chat: any = {};
		chat.message = this.messages[index];
		chat.roomname = roomname;
		chat.nickname = this.nickname;
		chat.date = this.datepipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss');
		chat.type = 'message';
		const newMessage = firebase.database().ref('chats/').push();
		newMessage.set(chat);
		this.messages[index] = '';
		setTimeout(() => this.scrolltop = this.chatcontent.nativeElement.scrollHeight * 2, 500);
	}

	minusBoxChat(index: number) {
		const chatbox = document.getElementById("chatbox" + index);
		if (chatbox.classList.contains("chatbox-min")) {
			chatbox.classList.remove("chatbox-min");
		} else {
			chatbox.classList.add("chatbox-min");
		}
	}
	closeBoxChat(index: number) {
		document.getElementById("chatbox" + index).style.display = 'none';
	}
}
