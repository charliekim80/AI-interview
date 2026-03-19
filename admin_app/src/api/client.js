import axios from 'axios';

// 개발 모드면 VITE_API_URL 또는 localhost:3000 사용, 프로덕션 배포 시에는 동일 도메인(origin) 사용
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
});

// 요청 인터셉터 (디버깅용)
api.interceptors.request.use((config) => {
    return config;
});

// 응답 에러 인터셉터 - 원본 에러 그대로 전달 (response.data 보존)
api.interceptors.response.use(
    (res) => res,
    (err) => {
        return Promise.reject(err);
    }
);

export default api;
