export const userPrefixKay = (userId) => `users:${userId}:otp`

export const confirmEmailKay = (userId) => `${userPrefixKay(userId)}:confirmEmail`
export const resendOtpKay = (userId) => `${userPrefixKay(userId)}:resend`
export const attemptsKay = (userId) => `${userPrefixKay(userId)}:attempts`
export const attemptBlockKay = (userId) => `${userPrefixKay(userId)}:block`
export const attemptBlockCountKay = (userId) => `${userPrefixKay(userId)}:blockCount`




export const userSessionJwtIdPrefixKay = (userId) => `users:${userId}:session`

export const userSessionJwtIdKay = (userId, jwtid) => `${userSessionJwtIdPrefixKay(userId)}:${jwtid}`
