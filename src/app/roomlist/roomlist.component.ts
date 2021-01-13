import { Component, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as firebase from 'firebase';
import { DatePipe } from '@angular/common';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const snapshotToArray = ( snapshot: any ) => {
    const returnArr = [];

    snapshot.forEach(( childSnapshot: any ) => {
        const item = childSnapshot.val();
        item.key = childSnapshot.key;
        returnArr.push( item );
    });

    return returnArr;
};

@Component( {
    selector: 'app-roomlist',
    templateUrl: './roomlist.component.html',
    styleUrls: ['./roomlist.component.css']
})
export class RoomlistComponent implements OnInit {
    @ViewChildren( 'chatcontent' ) chatcontent: QueryList<ElementRef>;
    scrolltop: number[] = [];

    nickname = '';
    displayedColumns: string[] = ['roomname'];
    rooms = [];
    isLoadingResults = true;
    chatMaps = new Map();
    unreadMessageByRoom = new Map();
    messages: string[] = [];

    subscription: Subscription;
    statusText: string;
    polling: any;
    isFirstCome: boolean = true;
    roomsLoadFromBegining: string[] = [];
    constructor( private route: ActivatedRoute, private router: Router, public datepipe: DatePipe ) {
        this.nickname = localStorage.getItem( 'nickname' );
        firebase.database().ref( 'rooms/' ).on( 'value', resp => {
            this.rooms = [];
            this.rooms = snapshotToArray( resp );
			/*this.rooms.forEach((room, index) => {
	                firebase.database().ref('chats/').orderByChild('roomname').equalTo(room.roomname).once('value', resp => {
	                    let chats: any = [];
                        chats = snapshotToArray(resp);
                        
                        setTimeout(() => {
                            document.getElementsByClassName("chat-messages")[index].scrollTop=
                                document.getElementsByClassName("chat-messages")[index].scrollHeight;
                        }
                            ,
                        500);
                        
                        this.chatMaps.set(room.roomname, chats);
	                    
	                });
			        
				this.messages.push('');
			});
		     this.rooms.forEach((room, index) => {
		            firebase.database().ref('chats/').orderByChild('roomname').limitToLast(1).equalTo(room.roomname).on('value', resp2 => {
		                if (this.isFirstCome) {
		                    if (index == this.rooms.length-1) {
		                        this.isFirstCome = false;
		                    }
		                } else {
		                    let chats: any = [];
		                    chats = snapshotToArray(resp2);
							if (document.getElementById('chatbox'+room.roomname).classList.contains('chatbox-min')) {
								if (this.unreadMessageByRoom.has(room.roomname)) {
									this.unreadMessageByRoom.get(room.roomname).push(chats[0]);
								} else {
									this.unreadMessageByRoom.set(room.roomname,chats);	
								}
								
							} else {
								this.chatMaps.get(room.roomname).push(chats[0]);
							}
		                    
		                    setTimeout(() => {
		                        document.getElementById("chat-messages-"+room.roomname).scrollTop=
	                                document.getElementById("chat-messages-"+room.roomname).scrollHeight;
		                    },500);
		                    
		                }
		            });
		        });*/
            this.isLoadingResults = false;
        });
    }

    ngOnInit(): void {
		/*this.polling = setInterval(()=>
		{document.getElementsByClassName("chat-messages")[1].scrollTop=
		document.getElementsByClassName("chat-messages")[1].scrollHeight}, 500);
*/

    }

    openChatRoom( roomname: string ) {
        if ( !this.chatMaps.has( roomname ) ) {
            this.isFirstCome = true;
            firebase.database().ref( 'chats/' ).orderByChild( 'roomname' ).equalTo( roomname ).once( 'value', resp => {
                let chats: any = [];
                chats = snapshotToArray( resp );

                setTimeout(() => {
                    document.getElementById( "chat-messages-" + roomname ).scrollTop =
                        document.getElementById( "chat-messages-" + roomname ).scrollHeight;
                }
                    ,
                    500 );

                this.chatMaps.set( roomname, chats );
            });

            firebase.database().ref( 'chats/' ).orderByChild( 'roomname' ).limitToLast( 1 ).equalTo( roomname ).on( 'value', resp2 => {
                if ( this.isFirstCome ) {
                    this.isFirstCome = false;
                } else {
                    let chats: any = [];
                    chats = snapshotToArray( resp2 );
                    if (document.getElementById('chatbox'+roomname).classList.contains('chatbox-min')) {
                        if (this.unreadMessageByRoom.has(roomname)) {
                            this.unreadMessageByRoom.get(roomname).push(chats[0]);
                        } else {
                            this.unreadMessageByRoom.set(roomname,chats);  
                        }
                        
                    } else {
                        this.chatMaps.get(roomname).push(chats[0]);
                    }
                    setTimeout(() => {
                        document.getElementById( "chat-messages-" + roomname ).scrollTop =
                            document.getElementById( "chat-messages-" + roomname ).scrollHeight;
                    }, 500 );

                }
            });
            this.rooms.forEach(( room, index ) => {
                setTimeout(() => {
                    document.getElementsByClassName( "chat-messages" )[index].scrollTop =
                        document.getElementsByClassName( "chat-messages" )[index].scrollHeight;
                }
                    ,
                    500 );
            });
        } else {
            document.getElementById( "chatbox" + roomname ).style.removeProperty( 'display' );
            setTimeout(() => {
                document.getElementById( "chat-messages-" + roomname ).scrollTop =
                    document.getElementById( "chat-messages-" + roomname ).scrollHeight;
            }
                ,
                500 );
        }
    }
    enterChatRoom( roomname: string ) {
        const chat = { roomname: '', nickname: '', message: '', date: '', type: '' };
        chat.roomname = roomname;
        chat.nickname = this.nickname;
        chat.date = this.datepipe.transform( new Date(), 'dd/MM/yyyy HH:mm:ss' );
        chat.message = `${this.nickname} enter the room`;
        chat.type = 'join';
        const newMessage = firebase.database().ref( 'chats/' ).push();
        newMessage.set( chat );

        firebase.database().ref( 'roomusers/' ).orderByChild( 'roomname' ).equalTo( roomname ).on( 'value', ( resp: any ) => {
            let roomuser = [];
            roomuser = snapshotToArray( resp );
            const user = roomuser.find( x => x.nickname === this.nickname );
            if ( user !== undefined ) {
                const userRef = firebase.database().ref( 'roomusers/' + user.key );
                userRef.update( { status: 'online' });
            } else {
                const newroomuser = { roomname: '', nickname: '', status: '' };
                newroomuser.roomname = roomname;
                newroomuser.nickname = this.nickname;
                newroomuser.status = 'online';
                const newRoomUser = firebase.database().ref( 'roomusers/' ).push();
                newRoomUser.set( newroomuser );
            }
        });

    }

    logout(): void {
        localStorage.removeItem( 'nickname' );
        this.router.navigate( ['/login'] );
    }


    send( index: number, roomname: string ) {
        let chat: any = {};
        chat.message = this.messages[index];
        chat.roomname = roomname;
        chat.nickname = this.nickname;
        chat.date = this.datepipe.transform( new Date(), 'dd/MM/yyyy HH:mm:ss' );
        chat.type = 'message';
        const newMessage = firebase.database().ref( 'chats/' ).push();
        newMessage.set( chat );
        this.messages[index] = '';
    }

    minusBoxChat( roomname: string ) {
        const chatbox = document.getElementById( "chatbox" + roomname );
        if ( chatbox.classList.contains( "chatbox-min" ) ) {
            chatbox.classList.remove( "chatbox-min" );
            if ( this.unreadMessageByRoom.get( roomname ) ) {
                this.chatMaps.get( roomname ).push( ...this.unreadMessageByRoom.get( roomname ) );
            }
            this.unreadMessageByRoom.delete( roomname );
            setTimeout(() => {
                document.getElementById( "chat-messages-" + roomname ).scrollTop =
                    document.getElementById( "chat-messages-" + roomname ).scrollHeight;
            }, 500 );
        } else {
            chatbox.classList.add( "chatbox-min" );
        }
    }
    closeBoxChat( roomname: string ) {
        document.getElementById( "chatbox" + roomname ).style.display = 'none';
        this.exitChat( roomname );
    }
    exitChat( roomname: string ) {
        document.getElementById( "chatbox" + roomname ).style.display = 'none';
        firebase.database().ref( 'roomusers/' ).orderByChild( 'roomname' ).equalTo( roomname ).on( 'value', ( resp: any ) => {
            let roomuser = [];
            roomuser = snapshotToArray( resp );
            const user = roomuser.find( x => x.nickname === this.nickname );
            if ( user !== undefined ) {
                const userRef = firebase.database().ref( 'roomusers/' + user.key );
                userRef.update( { status: 'offline' });
            }
        });

    }
}
