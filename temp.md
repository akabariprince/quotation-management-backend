Use these 5 WhatsApp templates in InboundSage. They are aligned with the current backend payload.

Recommended template names:
- App type `customer_otp_verification` -> `customer_otp_code`
- App type `user_otp_verification` -> `user_otp_code`
- App type `discount_approval` -> `discount_approval_otp_code`
- App type `project_quotation` -> `customer_project_quotation`
- App type `master_data_change` -> `master_data_change_otp_code`

**1. Customer OTP Verification**
- App type: `customer_otp_verification`
- Template name: `customer_otp_code`
- Category: `AUTHENTICATION`
- Variables sent by app: `1`

```json
{
  "name": "customer_otp_code",
  "category": "AUTHENTICATION",
  "language": "en",
  "components": {
    "meta": [
      {
        "type": "BODY",
        "text": "*{{1}}* is your ESIPL customer verification code. For your security, do not share this code.",
        "example": {
          "body_text": [["123456"]]
        },
        "add_security_recommendation": true
      },
      {
        "type": "BUTTONS",
        "buttons": [
          {
            "type": "URL",
            "text": "Copy code",
            "url": "https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp{{1}}",
            "example": [
              "https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp123456"
            ]
          }
        ]
      }
    ],
    "inboundsageForm": {
      "body": "{{1}} is your ESIPL customer verification code.",
      "authBody": "{{1}} is your ESIPL customer verification code.",
      "buttons": [
        {
          "type": "OTP",
          "otpType": "COPY_CODE"
        }
      ],
      "buttonMode": "NONE",
      "headerType": "NONE",
      "useCustomMediaUrl": false,
      "addSecurityDisclaimer": true
    }
  }
}
```

**2. User OTP Verification**
- App type: `user_otp_verification`
- Template name: `user_otp_code`
- Category: `AUTHENTICATION`
- Variables sent by app: `1`

```json
{
  "name": "user_otp_code",
  "category": "AUTHENTICATION",
  "language": "en",
  "components": {
    "meta": [
      {
        "type": "BODY",
        "text": "*{{1}}* is your ESIPL user verification code. For your security, do not share this code.",
        "example": {
          "body_text": [["123456"]]
        },
        "add_security_recommendation": true
      },
      {
        "type": "BUTTONS",
        "buttons": [
          {
            "type": "URL",
            "text": "Copy code",
            "url": "https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp{{1}}",
            "example": [
              "https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp123456"
            ]
          }
        ]
      }
    ],
    "inboundsageForm": {
      "body": "{{1}} is your ESIPL user verification code.",
      "authBody": "{{1}} is your ESIPL user verification code.",
      "buttons": [
        {
          "type": "OTP",
          "otpType": "COPY_CODE"
        }
      ],
      "buttonMode": "NONE",
      "headerType": "NONE",
      "useCustomMediaUrl": false,
      "addSecurityDisclaimer": true
    }
  }
}
```

**3. Discount Approval Notifications**
- App type: `discount_approval`
- Template name: `discount_approval_otp_code`
- Category: `AUTHENTICATION`
- Variables sent by app: `1`

```json
{
  "name": "discount_approval_otp_code",
  "category": "AUTHENTICATION",
  "language": "en",
  "components": {
    "meta": [
      {
        "type": "BODY",
        "text": "*{{1}}* is your ESIPL discount approval verification code. For your security, do not share this code.",
        "example": {
          "body_text": [["123456"]]
        },
        "add_security_recommendation": true
      },
      {
        "type": "BUTTONS",
        "buttons": [
          {
            "type": "URL",
            "text": "Copy code",
            "url": "https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp{{1}}",
            "example": [
              "https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp123456"
            ]
          }
        ]
      }
    ],
    "inboundsageForm": {
      "body": "{{1}} is your ESIPL discount approval verification code.",
      "authBody": "{{1}} is your ESIPL discount approval verification code.",
      "buttons": [
        {
          "type": "OTP",
          "otpType": "COPY_CODE"
        }
      ],
      "buttonMode": "NONE",
      "headerType": "NONE",
      "useCustomMediaUrl": false,
      "addSecurityDisclaimer": true
    }
  }
}
```

**4. Project Quotation Notifications**
- App type: `project_quotation`
- Template name: `customer_project_quotation`
- Category: `UTILITY`
- Variables sent by app: `6`
- Header: `DOCUMENT`

```json
{
  "name": "customer_project_quotation",
  "category": "UTILITY",
  "language": "en",
  "components": {
    "meta": [
      {
        "type": "HEADER",
        "format": "DOCUMENT",
        "example": {
          "header_handle": [
            "https://your-public-domain.com/uploads/pdfs/sample-project-quotation.pdf"
          ]
        }
      },
      {
        "type": "BODY",
        "text": "Dear {{1}}, your ESIPL quotation is ready for review. Total value including GST is {{2}}. Project number is {{3}}. Customer name is {{4}}. Total quotation items are {{5}}. {{6}} is final quotation value.",
        "example": {
          "body_text": [
            ["Rohit Sharma", "Rs. 118", "PJ2844610947", "Rakesh Sharma", "1", "Rs. 118"]
          ]
        }
      },
      {
        "type": "FOOTER",
        "text": "Ecstatics Spaces India Pvt. Ltd."
      }
    ],
    "inboundsageForm": {
      "body": "Dear {{1}}, your ESIPL quotation is ready for review. Total value including GST is {{2}}. Project number is {{3}}. Customer name is {{4}}. Total quotation items are {{5}}. {{6}} is final quotation value.",
      "footer": "Ecstatics Spaces India Pvt. Ltd.",
      "buttonMode": "NONE",
      "headerType": "DOCUMENT",
      "headerMediaUrl": "https://your-public-domain.com/uploads/pdfs/sample-project-quotation.pdf",
      "variableExamples": {
        "1": "Rohit Sharma",
        "2": "Rs. 118",
        "3": "PJ2844610947",
        "4": "Rakesh Sharma",
        "5": "1",
        "6": "Rs. 118"
      },
      "useCustomMediaUrl": true
    }
  }
}
```

**5. Master Data Change Notifications**
- App type: `master_data_change`
- Template name: `master_data_change_otp_code`
- Category: `AUTHENTICATION`
- Variables sent by app: `1`

```json
{
  "name": "master_data_change_otp_code",
  "category": "AUTHENTICATION",
  "language": "en",
  "components": {
    "meta": [
      {
        "type": "BODY",
        "text": "*{{1}}* is your ESIPL master data verification code. For your security, do not share this code.",
        "example": {
          "body_text": [["123456"]]
        },
        "add_security_recommendation": true
      },
      {
        "type": "BUTTONS",
        "buttons": [
          {
            "type": "URL",
            "text": "Copy code",
            "url": "https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp{{1}}",
            "example": [
              "https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp123456"
            ]
          }
        ]
      }
    ],
    "inboundsageForm": {
      "body": "{{1}} is your ESIPL master data verification code.",
      "authBody": "{{1}} is your ESIPL master data verification code.",
      "buttons": [
        {
          "type": "OTP",
          "otpType": "COPY_CODE"
        }
      ],
      "buttonMode": "NONE",
      "headerType": "NONE",
      "useCustomMediaUrl": false,
      "addSecurityDisclaimer": true
    }
  }
}
```

**Important**
- Template names must be lowercase with underscores.
- Customer OTP, user OTP, discount approval OTP, and master data OTP now send only one variable: the OTP code.
- Project quotation must use a `DOCUMENT` header.
- Project quotation PDF will fail in WhatsApp if `API_BASE_URL` is `localhost` or another private URL. Use a public HTTPS domain.
- After creating the templates in InboundSage, save the exact template names in Settings.
