package ai.opspilot.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.LinkedHashMap;
import java.util.Map;

@Converter
public class MetadataConverter implements AttributeConverter<Map<String, Object>, String> {
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final TypeReference<Map<String, Object>> TYPE = new TypeReference<>() {};

  @Override
  public String convertToDatabaseColumn(Map<String, Object> value) {
    try {
      return MAPPER.writeValueAsString(value == null ? Map.of() : value);
    } catch (Exception e) {
      return "{}";
    }
  }

  @Override
  public Map<String, Object> convertToEntityAttribute(String value) {
    if (value == null || value.isBlank()) return new LinkedHashMap<>();
    try {
      return MAPPER.readValue(value, TYPE);
    } catch (Exception e) {
      return new LinkedHashMap<>();
    }
  }
}
