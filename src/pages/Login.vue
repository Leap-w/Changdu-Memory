<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NCard,
  NSpace,
  useMessage,
} from 'naive-ui'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const message = useMessage()

const isRegister = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const modeTitle = computed(() => (isRegister.value ? '注册' : '登录'))
const modeLabel = computed(() => (isRegister.value ? '已有账号？去登录' : '没有账号？注册'))
const submitLabel = computed(() => (isRegister.value ? '注册' : '登录'))

const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' ? redirect : '/'
})

async function handleSubmit() {
  if (!email.value || !password.value) {
    message.warning('请填写邮箱和密码')
    return
  }

  if (isRegister.value && password.value !== confirmPassword.value) {
    message.warning('两次密码输入不一致')
    return
  }

  try {
    if (isRegister.value) {
      const data = await authStore.register(email.value, password.value)
      if (!data.session) {
        message.success('注册成功，请前往邮箱完成验证后再登录')
        isRegister.value = false
        password.value = ''
        confirmPassword.value = ''
        return
      }
      message.success('注册并登录成功')
    } else {
      await authStore.login(email.value, password.value)
      message.success('登录成功')
    }
    router.push(redirectPath.value)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '操作失败'
    message.error(msg)
  }
}

function toggleMode() {
  isRegister.value = !isRegister.value
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 品牌区域 -->
      <div class="login-brand">
        <div class="login-logo">
          🏔️
        </div>
        <h1 class="login-title">
          昌都记忆
        </h1>
        <p class="login-subtitle">
          Changdu Memory
        </p>
      </div>

      <!-- 表单卡片 -->
      <NCard class="login-card">
        <h2 class="login-card-title">
          {{ modeTitle }}
        </h2>

        <NForm @submit.prevent="handleSubmit">
          <NFormItem>
            <NInput
              v-model:value="email"
              type="text"
              placeholder="邮箱"
              size="large"
              :input-props="{ type: 'email', autocomplete: 'email' }"
              clearable
            />
          </NFormItem>

          <NFormItem>
            <NInput
              v-model:value="password"
              type="password"
              placeholder="密码"
              size="large"
              show-password-on="click"
              :input-props="{ autocomplete: isRegister ? 'new-password' : 'current-password' }"
            />
          </NFormItem>

          <NFormItem v-if="isRegister">
            <NInput
              v-model:value="confirmPassword"
              type="password"
              placeholder="确认密码"
              size="large"
              show-password-on="click"
              :input-props="{ autocomplete: 'new-password' }"
            />
          </NFormItem>

          <NFormItem>
            <NButton
              type="primary"
              size="large"
              block
              :loading="authStore.loading"
              attr-type="submit"
            >
              {{ submitLabel }}
            </NButton>
          </NFormItem>
        </NForm>

        <NSpace justify="center">
          <NButton text type="primary" @click="toggleMode">
            {{ modeLabel }}
          </NButton>
        </NSpace>
      </NCard>

      <!-- 底部版本信息 -->
      <p class="login-version">
        V5.0
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--spacing-page);
  background: linear-gradient(160deg, #e8f0fe 0%, var(--color-bg) 50%, #e8f5e9 100%);
}

.login-container {
  width: 100%;
  max-width: 400px;
}

/* 品牌区域 */
.login-brand {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  font-size: 56px;
  margin-bottom: 12px;
}

.login-title {
  font-size: var(--font-title);
  color: var(--color-primary);
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0 0 4px;
}

.login-subtitle {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  letter-spacing: 1px;
  margin: 0;
}

/* 卡片 */
.login-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.login-card-title {
  font-size: var(--font-card-title);
  color: var(--color-text-primary);
  text-align: center;
  margin: 0 0 var(--spacing-card);
}

/* 输入框 */
:deep(.n-input) {
  height: 48px;
}

/* 按钮 */
:deep(.n-button) {
  height: 48px;
  font-size: var(--font-content);
  font-weight: 600;
  border-radius: var(--radius-button);
}

/* 底部 */
.login-version {
  text-align: center;
  margin-top: 24px;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  opacity: 0.6;
}
</style>
