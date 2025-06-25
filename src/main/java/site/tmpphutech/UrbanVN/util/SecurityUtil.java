package site.tmpphutech.UrbanVN.util;

import java.util.UUID;

public class SecurityUtil {
    public static String generateRandomToken(){
        return UUID.randomUUID().toString();
    }
}