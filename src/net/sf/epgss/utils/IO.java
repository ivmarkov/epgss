package net.sf.epgss.utils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.KeyGenerator;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public class IO {
	private static byte[] PBE_SALT = { (byte) 0xA9, (byte) 0x9B, (byte) 0xC8, (byte) 0x32, (byte) 0x56, (byte) 0x35, (byte) 0xE3, (byte) 0x03 };
	
	private IO() {} // Singleton

    public static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] buf = new byte[16384];
        for(int read = 0; (read = in.read(buf)) >= 0;)
            out.write(buf, 0, read);
    }

    public static byte[] hash(InputStream in, String hashAlgorithm) throws NoSuchAlgorithmException, IOException {
	    MessageDigest algorithm = MessageDigest.getInstance(hashAlgorithm);
	    
	    byte[] buf = new byte[16384];
	    for(int read = 0; (read = in.read(buf)) >= 0;)
            algorithm.update(buf, 0, read);
	
		return algorithm.digest();
	}

    public static SecretKey generateKey(String encAlgorithm) throws NoSuchAlgorithmException {
    	return KeyGenerator.getInstance(encAlgorithm).generateKey();
    }
    
    public static SecretKey generatePBEKey(String pbeAlgorithm, String secret) throws InvalidKeySpecException, NoSuchAlgorithmException {
    	KeySpec keySpec = new PBEKeySpec(secret.toCharArray(), PBE_SALT, 19);
		return SecretKeyFactory.getInstance(pbeAlgorithm).generateSecret(keySpec);
    }
    
    public static void crypt(InputStream in, OutputStream out, String encAlgorithm, SecretKey key, boolean encrypt) throws NoSuchAlgorithmException, NoSuchPaddingException, InvalidKeyException, IOException, IllegalBlockSizeException, BadPaddingException {
    	Cipher algorithm = Cipher.getInstance(encAlgorithm);

    	algorithm.init(encrypt? Cipher.ENCRYPT_MODE: Cipher.DECRYPT_MODE, key);
    	
	    byte[] buf = new byte[16384];
	    for(int read = 0; (read = in.read(buf)) >= 0;)
            out.write(algorithm.update(buf, 0, read));

	    out.write(algorithm.doFinal());
    }
}
