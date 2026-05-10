package com.indusync.indusync_backend.shared.domain.valueobjects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Objects;

/**
 * Contact person value object representing a person's contact information.
 * Used for order contacts and other communication purposes.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Embeddable
public class ContactPerson {

    @NotBlank(message = "Name der Kontaktperson ist erforderlich")
    @Size(max = 100, message = "Name darf maximal 100 Zeichen lang sein")
    @Column(name = "contact_name", length = 100)
    private String name;

    @NotBlank(message = "E-Mail-Adresse ist erforderlich")
    @Email(message = "Gültige E-Mail-Adresse erforderlich")
    @Size(max = 150, message = "E-Mail-Adresse darf maximal 150 Zeichen lang sein")
    @Column(name = "contact_email", length = 150)
    private String email;

    @Size(max = 20, message = "Telefonnummer darf maximal 20 Zeichen lang sein")
    @Column(name = "contact_phone", length = 20)
    private String phone;

    /**
     * Default constructor for JPA.
     */
    protected ContactPerson() {
    }

    /**
     * Constructor for ContactPerson.
     *
     * @param name  the contact person's name
     * @param email the contact person's email
     * @param phone the contact person's phone (optional)
     */
    public ContactPerson(String name, String email, String phone) {
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    /**
     * Creates a ContactPerson with name and email only.
     *
     * @param name  the contact person's name
     * @param email the contact person's email
     * @return new ContactPerson instance
     */
    public static ContactPerson of(String name, String email) {
        return new ContactPerson(name, email, null);
    }

    /**
     * Creates a ContactPerson with all contact information.
     *
     * @param name  the contact person's name
     * @param email the contact person's email
     * @param phone the contact person's phone
     * @return new ContactPerson instance
     */
    public static ContactPerson of(String name, String email, String phone) {
        return new ContactPerson(name, email, phone);
    }

    /**
     * Gets the contact person's name.
     *
     * @return contact name
     */
    public String getName() {
        return name;
    }

    /**
     * Gets the contact person's email.
     *
     * @return contact email
     */
    public String getEmail() {
        return email;
    }

    /**
     * Gets the contact person's phone.
     *
     * @return contact phone (may be null)
     */
    public String getPhone() {
        return phone;
    }

    /**
     * Checks if phone number is available.
     *
     * @return true if phone is not null and not empty
     */
    public boolean hasPhone() {
        return phone != null && !phone.trim().isEmpty();
    }

    /**
     * Gets formatted contact information for display.
     *
     * @return formatted contact string
     */
    public String getFormattedContact() {
        StringBuilder sb = new StringBuilder(name);
        sb.append(" (").append(email);
        if (hasPhone()) {
            sb.append(", ").append(phone);
        }
        sb.append(")");
        return sb.toString();
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null || getClass() != obj.getClass())
            return false;
        ContactPerson that = (ContactPerson) obj;
        return Objects.equals(name, that.name) &&
                Objects.equals(email, that.email) &&
                Objects.equals(phone, that.phone);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, email, phone);
    }

    @Override
    public String toString() {
        return String.format("ContactPerson{name='%s', email='%s', phone='%s'}",
                name, email, phone);
    }
}