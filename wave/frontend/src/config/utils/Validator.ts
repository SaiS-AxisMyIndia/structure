export const Validator = {

    //is Valid mail
    isValidEmail: (email: string | null | undefined): boolean => {
        if (!email || typeof email !== 'string') {return false;}
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

       //is Valid password
    isValidPassword: (password: string | null | undefined): boolean => {
        if (!password || typeof password !== 'string') {return false;}
        // Password must be at least 8 characters long and contain at least one letter and one number
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return passwordRegex.test(password);
    },

    //is Valid URL
    isValidURL: (url: string | null | undefined): boolean => {
        if (!url || typeof url !== 'string') {return false;}
        try {
            // eslint-disable-next-line no-new -- constructed only to see if it throws; there's no other built-in URL-validity check
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // strip spaces, hyphens and parentheses so formatted numbers (e.g. "+91 22-2410 7000") can be validated/dialed
    normalizePhoneNumber: (phone: string | null | undefined): string => {
        if (!phone || typeof phone !== 'string') {return '';}
        return phone.replace(/[\s\-()]/g, '');
    },

    //is Valid phone number
    isValidPhoneNumber: (phone: string | null | undefined, countryCode: string = 'IN'): boolean => {


        if (!phone || typeof phone !== 'string') {return false;}
        const normalized = Validator.normalizePhoneNumber(phone);
        if(countryCode === 'IN'){
            // Exactly 10 digits, optionally prefixed with +91/0 - a real
            // Indian phone number (mobile, starts 6-9, or a landline
            // number with its STD code already folded in, starts 1-9) is
            // always 10 digits, never more or less. The previous version
            // here (`[1-9]\d{7,10}`, 8-11 total digits) wrongly accepted
            // an incomplete 8-9 digit number as if it were a valid
            // landline.
            const phoneRegex = /^(\+91|0)?[1-9]\d{9}$/;
            return phoneRegex.test(normalized);
        }
        if(countryCode === 'US'){
            const phoneRegex = /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'UK'){
            const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'CA'){
            const phoneRegex = /^\(?([2-9][0-8][0-9])\)?[-.●]?([2-9][0-9]{2})[-.●]?([0-9]{4})$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'AU'){
            const phoneRegex = /^(\+?61|0)4\d{8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'DE'){
            const phoneRegex = /^(\+49|0)[1-9][0-9]{1,4}[0-9]{3,}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'FR'){
            const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'JP'){
            const phoneRegex = /^(\+81|0)\d{1,4}\d{1,4}\d{4}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'BR'){
            const phoneRegex = /^(\+55|0)[1-9][0-9]{3,4}[0-9]{4}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'ZA'){
            const phoneRegex = /^(\+27|0)[1-9][0-9]{8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'NG'){
            const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'MX'){
            const phoneRegex = /^(\+52|0)[1-9][0-9]{2}[0-9]{4}[0-9]{4}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'IT'){
            const phoneRegex = /^(\+39|0)[1-9][0-9]{2,3}[0-9]{6,7}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'ES'){
            const phoneRegex = /^(\+34|0)[6-7][0-9]{8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'RU'){
            const phoneRegex = /^(\+7|8)[0-9]{10}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'KR'){
            const phoneRegex = /^(\+82|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'SE'){
            const phoneRegex = /^(\+46|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'CH'){
            const phoneRegex = /^(\+41|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'BE'){
            const phoneRegex = /^(\+32|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'AT'){
            const phoneRegex = /^(\+43|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'DK'){
            const phoneRegex = /^(\+45|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'NO'){
            const phoneRegex = /^(\+47|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'FI'){
            const phoneRegex = /^(\+358|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'IE'){
            const phoneRegex = /^(\+353|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'NZ'){
            const phoneRegex = /^(\+64|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'SG'){
            const phoneRegex = /^(\+65|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'MY'){
            const phoneRegex = /^(\+60|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'TH'){
            const phoneRegex = /^(\+66|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'PH'){
            const phoneRegex = /^(\+63|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'ID'){
            const phoneRegex = /^(\+62|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'VN'){
            const phoneRegex = /^(\+84|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'TW'){
            const phoneRegex = /^(\+886|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'HK'){
            const phoneRegex = /^(\+852|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'CN'){
            const phoneRegex = /^(\+86|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'PK'){
            const phoneRegex = /^(\+92|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'BD'){
            const phoneRegex = /^(\+880|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'LK'){
            const phoneRegex = /^(\+94|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'NP'){
            const phoneRegex = /^(\+977|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'MM'){
            const phoneRegex = /^(\+95|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'KH'){
            const phoneRegex = /^(\+855|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'LA'){
            const phoneRegex = /^(\+856|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'MN'){
            const phoneRegex = /^(\+976|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'UZ'){
            const phoneRegex = /^(\+998|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'KZ'){
            const phoneRegex = /^(\+7|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'TJ'){
            const phoneRegex = /^(\+992|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'KG'){
            const phoneRegex = /^(\+996|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'TM'){
            const phoneRegex = /^(\+993|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'AF'){
            const phoneRegex = /^(\+93|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'IR'){
            const phoneRegex = /^(\+98|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'IQ'){
            const phoneRegex = /^(\+964|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'SY'){
            const phoneRegex = /^(\+963|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'JO'){
            const phoneRegex = /^(\+962|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'LB'){
            const phoneRegex = /^(\+961|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'KW'){
            const phoneRegex = /^(\+965|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'SA'){
            const phoneRegex = /^(\+966|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'AE'){
            const phoneRegex = /^(\+971|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'OM'){
            const phoneRegex = /^(\+968|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'QA'){
            const phoneRegex = /^(\+974|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'BH'){
            const phoneRegex = /^(\+973|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'EG'){
            const phoneRegex = /^(\+20|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'MA'){
            const phoneRegex = /^(\+212|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'DZ'){
            const phoneRegex = /^(\+213|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'TN'){
            const phoneRegex = /^(\+216|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'LY'){
            const phoneRegex = /^(\+218|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'SD'){
            const phoneRegex = /^(\+249|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'ET'){
            const phoneRegex = /^(\+251|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'KE'){
            const phoneRegex = /^(\+254|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'TZ'){
            const phoneRegex = /^(\+255|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        if(countryCode === 'UG'){
            const phoneRegex = /^(\+256|0)[1-9][0-9]{7,8}$/;
            return phoneRegex.test(phone);
        }
        // Add more country-specific validations as needed
        return false;


    },



};
