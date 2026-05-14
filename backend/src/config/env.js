const REQUIRED_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'PORT',
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `[env] 필수 환경변수가 누락되었습니다: ${missing.join(', ')}\n` +
        `backend/.env.example 을 참고하여 backend/.env 파일을 생성해주세요.`
    );
    process.exit(1);
  }

  return REQUIRED_VARS.reduce((acc, key) => {
    acc[key] = process.env[key];
    return acc;
  }, {});
}

const env = validateEnv();

module.exports = { env };
