<template>
  <div class="mainDivStyle">
    <div class="header">
      <Header :privilage="privilage" />
    </div>
    <div
      v-if="loginPhrase && getInfoResponse.status === 'success'"
      class="content"
    >
      <div v-if="zelCashSection !== null">
        <ZelCash />
      </div>
      <div v-if="zelNodeSection !== null">
        <ZelNode />
      </div>
      <div v-if="zelAdminSection !== null">
        <ZelAdmin />
      </div>
      <div v-if="zelAppsSection !== null">
        <ZelApps />
      </div>
      <br>
      <div v-if="privilage === 'none'">
        <Login />
      </div>
    </div>
    <div
      v-else-if="loginPhrase === ''"
      class="content"
    >
      <div v-if="errorMessage !== ''">
        <h3>
          {{ errorMessage }}
        </h3>
      </div>
      <div v-else>
        <h4>
          Loading...
        </h4>
      </div>
    </div>
    <div
      v-else-if="getInfoResponse.status === 'error'"
      class="content"
    >
      <div v-if="privilage === 'none'">
        <Login />
      </div>
      <br>
      <h3>
        Error connecting to the ZelCash Daemon
        <div v-if="privilage ==='admin'">
          <p>
            Please try to restart your ZelCash Daemon in ZelCash section.
          </p>
          <div v-if="zelCashSection !== null">
            <ZelCash />
          </div>
          <div v-if="zelNodeSection !== null">
            <ZelNode />
          </div>
          <div v-if="zelAdminSection !== null">
            <ZelAdmin />
          </div>
          <div v-if="zelAppsSection !== null">
            <ZelApps />
          </div>
        </div>
      </h3>
    </div>
    <div
      v-else
      class="content"
    >
      <h4>
        Loading...
      </h4>
    </div>
    <div class="footer">
      <Footer />
    </div>
  </div>
</template>

<script>
import Vuex, { mapState } from 'vuex';
import Vue from 'vue';

import ZelCashService from '@/services/ZelCashService';
import zelIDService from '@/services/ZelIDService';

const Header = () => import('@/components/shared/Header.vue');
const Footer = () => import('@/components/shared/Footer.vue');
const Login = () => import('@/components/Login.vue');
const ZelCash = () => import('@/components/ZelCash.vue');
const ZelNode = () => import('@/components/ZelNode.vue');
const ZelAdmin = () => import('@/components/ZelAdmin.vue');
const ZelApps = () => import('@/components/ZelApps.vue');

const qs = require('qs');

Vue.use(Vuex);
const vue = new Vue();

export default {
  name: 'MainPage',
  components: {
    Header, Footer, Login, ZelCash, ZelNode, ZelAdmin, ZelApps,
  },
  data() {
    return {
      getInfoResponse: {
        status: '',
        message: '',
      },
      errorMessage: '',
      loginPhrase: '',
    };
  },
  computed: {
    ...mapState([
      'userconfig',
      'config',
      'privilage',
      'zelCashSection',
      'zelNodeSection',
      'zelAdminSection',
      'zelAppsSection',
    ]),
  },
  mounted() {
    this.loadSession();
    this.getZelIdLoginPhrase();
    this.zelcashGetInfo();
  },
  methods: {
    loadSession() {
      // TODO check if still logged in
      const zelidauth = localStorage.getItem('zelidauth');
      const auth = qs.parse(zelidauth);
      this.$store.commit('setPrivilage', 'none');
      if (auth) {
        if (auth.zelid) {
          if (auth.zelid === this.config.zelTeamZelId) {
            this.$store.commit('setPrivilage', 'zelteam');
          } else if (auth.zelid === this.userconfig.zelid) {
            this.$store.commit('setPrivilage', 'admin');
          } else if (auth.zelid.length > 24) { // very basic check that does the job
            this.$store.commit('setPrivilage', 'user');
          } else {
            localStorage.removeItem('zelidauth');
          }
        }
      }
    },
    getZelIdLoginPhrase() {
      zelIDService.loginPhrase()
        .then((response) => {
          console.log(response);
          if (response.data.status === 'error') {
            if (response.data.data.name === 'MongoNetworkError') {
              this.errorMessage = 'Failed to connect to MongoDB.';
            } else {
              this.errorMessage = response.data.data.message;
            }
          } else {
            this.loginPhrase = response.data.data;
          }
        })
        .catch((error) => {
          console.log(error);
          vue.$message.error(error);
          this.errorMessage = 'Error connecting to ZelBack';
        });
    },
    async zelcashGetInfo() {
      const response = await ZelCashService.getInfo();
      this.getInfoResponse.status = response.data.status;
      this.getInfoResponse.message = response.data.data;
    },
    activeLoginPhrases() {
      const zelidauth = localStorage.getItem('zelidauth');
      const auth = qs.parse(zelidauth);
      console.log(auth);
      zelIDService.activeLoginPhrases(zelidauth)
        .then((response) => {
          console.log(response);
          if (response.data.status === 'error') {
            vue.$message.error(response.data.data.message);
          }
        })
        .catch((e) => {
          console.log(e);
          console.log(e.code);
          vue.$message.error(e.toString());
        });
    },
  },
};
</script>
