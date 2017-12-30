

Vue.prototype.$eventHub = new Vue();

Vue.component('album-title-input', {
  props: ['title', 'enterHandler'],
  template: '<input autofocus autocomplete="off" placeholder="제목입력" v-model="title" @keyup.enter="enterHandler">'
})

Vue.component('album-create-form', {
  template: [
    '<form @submit.prevent>',
      '<album-title-input ref="input" :title="title" :enterHandler="create"></album-title-input>',
      '<button @click="create">생성</button>',
    '</form>'
  ].join(''),
  data: () => ({ title: '' }),
  methods: {
    create() {
      if(!this.$refs.input.$el.value)
        return;
      this.$eventHub.$emit('oncreated', this.$refs.input.$el.value);
      this.$refs.input.$el.value = '';
    }
  }
});

Vue.component('album-card-view', {
  props: ['album'],
  data: () => ({ editable: false }),
  template: [
    '<tr>',
      '<td width="15%" align="center"><img src="http://via.placeholder.com/75/09f.png/fff"></td>',
      '<td width="75%">',
        '<album-title-input v-if="editable" ref="input" :title="album.title" :enterHandler="edited"></album-title-input>',
        '<p v-else v-text="album.title"></p>',
      '</td>',
      '<td width="10%" align="center">',
        '<button v-if="!editable" @click="edit()">수정</button>',
        '<button @click="remove(album.id)">삭제</button>',
      '</td>',
    '</tr>',
  ].join(''),
  methods: {
    remove() {
      this.$eventHub.$emit('onremoved', this.album.id);
    },
    edit() {
      this.editable = true;
      const refs = this.$refs;
      setTimeout(() => (refs.input.$el.focus()));
    },
    edited() {
      this.editable = false;
      this.$eventHub.$emit('onedited', { ...this.album, title: this.$refs.input.$el.value });
    }
  }
});

Vue.component('album-list-container', {
  props: ['albums'],
  template: [
    '<main style="padding-bottom: 20px">',
      '<table align="center" width="640">',
        '<album-card-view v-for="album in albums" :album="album" key="album.id"></album-card-view>',
      '</table>',
    '</main>'
  ].join(''),
  methods: {

  }
});

Vue.component('sign-in-with-facebook', {
  template: [
    '<button @click="signInWithFacebook">페이스북으로 로그인하기</button>'
  ].join(''),
  methods: {
    signInWithFacebook() {
      const self = this;
      const REQUIRED_PERMISSION = 'email';
      function isValidResponse(response) { return (response.status === 'connected') && response.authResponse; }
      
      FB.login(function(response) {
        if(isValidResponse(response))
          self.$eventHub.$emit('onfacebookloginSuccess', { facebookId: response.authResponse.userID, accessToken: response.authResponse.accessToken });
        else
          self.$eventHub.$emit('onfacebookloginFailed', response.status);
      }, { scope: REQUIRED_PERMISSION });
    }
  }
})

Vue.component('landing-page', {
  template: [
    '<div style="text-align:center; padding-top: 250px">',
      '<h1 style="padding-bottom: 20px">hello world</h1>',
      '<sign-in-with-facebook></sign-in-with-facebook>',
    '<div>',
  ].join('')
});

Vue.component('main-page', {
  props: ['user'],
  data: () => ({
    albums: Album.next(),
    currentPage: 1,
    total: Album.size()
  }),
  template: [
    '<div>',
      '<div style="text-align:center">',
        '<h3>앨범 목록</h3>',
        '<album-create-form></album-create-form>',
      '</div>',
      '<album-list-container :albums="albums"></album-list-container>',
      '<b-pagination align="center" size="md" :total-rows="total" v-model="currentPage" :per-page="10" limit="10" @change="handlePageChange"></b-pagination>',
    '</div>',
  ].join(''),
  methods: {
    createAlbum(title) {
      Album.add({ title, id: (new Date).getTime(), userId: this.user.id });
      this.albums = Album.next(this.currentPage);
      this.total = Album.size();
    },
    updateAlbum(album) {
      Album.updateOne(album);
    },
    deleteAlbum(id) {
      Album.deleteOne(id);
      this.albums = Album.next(this.currentPage);
      this.total = Album.size();
    },
    handlePageChange(pageNo) {
      this.albums = Album.next(pageNo);
    }
  },
  created() {
    this.$eventHub.$on('onedited', this.updateAlbum);
    this.$eventHub.$on('onremoved', this.deleteAlbum);
    this.$eventHub.$on('oncreated', this.createAlbum);
  },

  beforeDestroy(){
    this.$eventHub.$off('onedited');
    this.$eventHub.$off('onremoved');
    this.$eventHub.$off('oncreated');
  },
});

const app = new Vue({
  el: '#app',
  data: () => ({ user: {  }, requiredLogin: true }),
  created() {
    this.$eventHub.$on('onfacebookloginSuccess', (response) => {
      this.user.id = response.facebookId;
      this.requiredLogin = false;
    });
    this.$eventHub.$on('onfacebookloginFailed', (response) => {
      window.alert(`로그인 실패: ${response.status}`);
      this.requiredLogin = true;
    });
  },

  beforeDestroy(){
    this.$eventHub.$off('onfacebookloginSuccess');
    this.$eventHub.$off('onfacebookloginFailed');
  }
});